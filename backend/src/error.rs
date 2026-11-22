use axum::extract::rejection::JsonRejection;
use axum::extract::{FromRequest, Request};
use axum::http::{HeaderName, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::de::DeserializeOwned;
use serde::Serialize;

#[derive(Debug, Clone)]
pub struct AppError {
    pub status: StatusCode,
    pub detail: String,
    pub headers: Vec<(HeaderName, HeaderValue)>,
}

#[derive(Serialize)]
struct ErrorBody<'a> {
    detail: &'a str,
}

impl AppError {
    pub fn new(status: StatusCode, detail: impl Into<String>) -> Self {
        Self {
            status,
            detail: detail.into(),
            headers: Vec::new(),
        }
    }

    pub fn with_header(mut self, name: HeaderName, value: &'static str) -> Self {
        self.headers.push((name, HeaderValue::from_static(value)));
        self
    }

    pub fn unauthorized(detail: impl Into<String>) -> Self {
        Self::new(StatusCode::UNAUTHORIZED, detail)
            .with_header(axum::http::header::WWW_AUTHENTICATE, "Bearer")
    }

    pub fn unauthorized_api_key() -> Self {
        Self::new(StatusCode::UNAUTHORIZED, "Invalid or missing API Key")
            .with_header(axum::http::header::WWW_AUTHENTICATE, "ApiKey")
    }

    pub fn forbidden(detail: impl Into<String>) -> Self {
        Self::new(StatusCode::FORBIDDEN, detail)
    }

    pub fn unprocessable(detail: impl Into<String>) -> Self {
        Self::new(StatusCode::UNPROCESSABLE_ENTITY, detail)
    }

    pub fn internal(detail: impl Into<String>) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, detail)
    }

    pub fn bad_gateway(detail: impl Into<String>) -> Self {
        Self::new(StatusCode::BAD_GATEWAY, detail)
    }

    pub fn service_unavailable(detail: impl Into<String>) -> Self {
        Self::new(StatusCode::SERVICE_UNAVAILABLE, detail)
    }
}

pub fn upstream_json_response<T: Serialize>(body: &T, error: Option<&str>) -> Response {
    let status = match error {
        Some(msg) if !msg.is_empty() && !msg.starts_with("Invalid tab id:") => {
            let lower = msg.to_ascii_lowercase();
            if lower.contains("timeout")
                || lower.contains("timed out")
                || lower.contains("unavailable")
            {
                StatusCode::SERVICE_UNAVAILABLE
            } else {
                StatusCode::BAD_GATEWAY
            }
        }
        _ => StatusCode::OK,
    };
    (status, Json(body)).into_response()
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let mut response = (
            self.status,
            Json(ErrorBody {
                detail: &self.detail,
            }),
        )
            .into_response();
        for (name, val) in self.headers {
            response.headers_mut().insert(name, val);
        }
        response
    }
}

/// Trait implemented by request payloads that enforce Pydantic-equivalent bounds.
pub trait ValidatePayload {
    fn validate(&self) -> Result<(), String>;
}

/// JSON extractor that maps syntax, deserialization, and domain validation errors to HTTP 422.
pub struct ValidatedJson<T>(pub T);

impl<S, T> FromRequest<S> for ValidatedJson<T>
where
    S: Send + Sync,
    T: DeserializeOwned + ValidatePayload,
{
    type Rejection = AppError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = Json::<T>::from_request(req, state)
            .await
            .map_err(|rejection: JsonRejection| AppError::unprocessable(rejection.body_text()))?;

        value.validate().map_err(AppError::unprocessable)?;

        Ok(ValidatedJson(value))
    }
}
