use std::any::Any;
use std::collections::HashMap;
use std::future::Future;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

use tokio::sync::{watch, Mutex};

struct CacheEntry {
    expiry: Instant,
    value: Arc<dyn Any + Send + Sync>,
}

pub struct TTLCache {
    store: RwLock<HashMap<String, CacheEntry>>,
    default_ttl: Duration,
    max_entries: usize,
}

impl TTLCache {
    pub fn new(default_ttl_seconds: f64, max_entries: usize) -> Self {
        Self {
            store: RwLock::new(HashMap::new()),
            default_ttl: Duration::from_secs_f64(default_ttl_seconds.max(0.0)),
            max_entries: max_entries.max(1),
        }
    }

    pub fn get<T: Clone + Send + Sync + 'static>(&self, key: &str) -> Option<T> {
        let now = Instant::now();
        {
            let guard = self.store.read().expect("cache rwlock poisoned");
            let entry = guard.get(key)?;
            if now < entry.expiry {
                return entry.value.downcast_ref::<T>().cloned();
            }
        }
        // Expired: upgrade to write lock and delete if still expired
        let mut guard = self.store.write().expect("cache rwlock poisoned");
        if let Some(entry) = guard.get(key) {
            if now >= entry.expiry {
                guard.remove(key);
                return None;
            }
            return entry.value.downcast_ref::<T>().cloned();
        }
        None
    }

    pub fn set<T: Send + Sync + 'static>(
        &self,
        key: impl Into<String>,
        value: T,
        ttl_seconds: Option<f64>,
    ) {
        let key_str = key.into();
        let now = Instant::now();
        let ttl = ttl_seconds
            .map(|s| Duration::from_secs_f64(s.max(0.0)))
            .unwrap_or(self.default_ttl);
        let expiry = now + ttl;

        let mut guard = self.store.write().expect("cache rwlock poisoned");
        if guard.len() >= self.max_entries && !guard.contains_key(&key_str) {
            guard.retain(|_, entry| now < entry.expiry);
            if guard.len() >= self.max_entries {
                if let Some(earliest_key) = guard
                    .iter()
                    .min_by_key(|(_, entry)| entry.expiry)
                    .map(|(k, _)| k.clone())
                {
                    guard.remove(&earliest_key);
                }
            }
        }
        guard.insert(
            key_str,
            CacheEntry {
                expiry,
                value: Arc::new(value),
            },
        );
    }

    pub fn delete(&self, key: &str) {
        let mut guard = self.store.write().expect("cache rwlock poisoned");
        guard.remove(key);
    }

    pub fn invalidate_prefix(&self, prefix: &str) {
        let mut guard = self.store.write().expect("cache rwlock poisoned");
        guard.retain(|k, _| !k.starts_with(prefix));
    }

    pub fn clear(&self) {
        let mut guard = self.store.write().expect("cache rwlock poisoned");
        guard.clear();
    }

    pub fn len(&self) -> usize {
        let now = Instant::now();
        let mut guard = self.store.write().expect("cache rwlock poisoned");
        guard.retain(|_, entry| now < entry.expiry);
        guard.len()
    }

    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
}

type SharedOutcome = Result<Arc<dyn Any + Send + Sync>, Arc<dyn Any + Send + Sync>>;
type InFlightReceiver = watch::Receiver<Option<SharedOutcome>>;

pub struct AsyncSingleflight {
    in_flight: Arc<Mutex<HashMap<String, InFlightReceiver>>>,
}

impl Default for AsyncSingleflight {
    fn default() -> Self {
        Self::new()
    }
}

struct InFlightCleanup {
    key: String,
    in_flight: Arc<Mutex<HashMap<String, InFlightReceiver>>>,
}

impl Drop for InFlightCleanup {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.in_flight.try_lock() {
            guard.remove(&self.key);
        }
    }
}

impl AsyncSingleflight {
    pub fn new() -> Self {
        Self {
            in_flight: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn execute<T, E, F, Fut>(&self, key: &str, f: F) -> Result<T, E>
    where
        T: Clone + Send + Sync + 'static,
        E: Clone + Send + Sync + 'static,
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<T, E>>,
    {
        let existing_rx = {
            let mut guard = self.in_flight.lock().await;
            if let Some(rx) = guard.get(key) {
                Some(rx.clone())
            } else {
                let (tx, rx) = watch::channel::<Option<SharedOutcome>>(None);
                guard.insert(key.to_string(), rx);
                drop(guard);

                let _cleanup = InFlightCleanup {
                    key: key.to_string(),
                    in_flight: Arc::clone(&self.in_flight),
                };

                let result = f().await;
                let outcome: SharedOutcome = match &result {
                    Ok(val) => Ok(Arc::new(val.clone())),
                    Err(err) => Err(Arc::new(err.clone())),
                };
                let _ = tx.send(Some(outcome));
                {
                    let mut guard = self.in_flight.lock().await;
                    guard.remove(key);
                }
                return result;
            }
        };

        let mut rx = existing_rx.expect("existing receiver present");
        let _ = rx.wait_for(|v| v.is_some()).await;
        let outcome = rx
            .borrow()
            .as_ref()
            .expect("singleflight completed with value")
            .clone();

        match outcome {
            Ok(arc_val) => Ok(arc_val
                .downcast_ref::<T>()
                .expect("singleflight type mismatch on Ok")
                .clone()),
            Err(arc_err) => Err(arc_err
                .downcast_ref::<E>()
                .expect("singleflight type mismatch on Err")
                .clone()),
        }
    }

    pub async fn clear(&self) {
        let mut guard = self.in_flight.lock().await;
        guard.clear();
    }
}
