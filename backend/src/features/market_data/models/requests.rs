use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::error::ValidatePayload;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SummariesRequest {
    pub summaries: Vec<HashMap<String, String>>,
}

impl ValidatePayload for SummariesRequest {
    fn validate(&self) -> Result<(), String> {
        if self.summaries.len() > 50 {
            return Err("summaries must contain at most 50 items".to_string());
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NavRequest {
    pub symbols: Vec<String>,
}

impl ValidatePayload for NavRequest {
    fn validate(&self) -> Result<(), String> {
        if self.symbols.len() > 50 {
            return Err("symbols must contain at most 50 items".to_string());
        }
        Ok(())
    }
}
