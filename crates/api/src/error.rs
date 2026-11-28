use axum::http::{HeaderName, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;
use sgsk_common::AppError;

#[derive(Debug, Clone)]
pub struct ApiError {
    pub status: StatusCode,
    pub error: String,
    pub code: &'static str,
    pub headers: Vec<(HeaderName, HeaderValue)>,
}

#[derive(Serialize)]
struct ErrorEnvelope<'a> {
    error: &'a str,
    code: &'a str,
}

impl ApiError {
    pub fn unauthorized_api_key() -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            error: "Invalid or missing API Key".to_string(),
            code: "UNAUTHORIZED_API_KEY",
            headers: vec![(
                axum::http::header::WWW_AUTHENTICATE,
                HeaderValue::from_static("ApiKey"),
            )],
        }
    }

    pub fn unauthorized(msg: impl Into<String>) -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            error: msg.into(),
            code: "UNAUTHORIZED",
            headers: vec![(
                axum::http::header::WWW_AUTHENTICATE,
                HeaderValue::from_static("Bearer"),
            )],
        }
    }

    pub fn forbidden(msg: impl Into<String>) -> Self {
        Self {
            status: StatusCode::FORBIDDEN,
            error: msg.into(),
            code: "FORBIDDEN",
            headers: Vec::new(),
        }
    }

    pub fn unprocessable(msg: impl Into<String>) -> Self {
        Self {
            status: StatusCode::UNPROCESSABLE_ENTITY,
            error: msg.into(),
            code: "VALIDATION_ERROR",
            headers: Vec::new(),
        }
    }
}

impl From<AppError> for ApiError {
    fn from(err: AppError) -> Self {
        match err {
            AppError::Unauthorized(msg) => Self::unauthorized(msg),
            AppError::Forbidden(msg) => Self::forbidden(msg),
            AppError::Validation(msg) => Self::unprocessable(msg),
            AppError::Upstream(msg) => Self {
                status: StatusCode::BAD_GATEWAY,
                error: msg,
                code: "UPSTREAM_ERROR",
                headers: Vec::new(),
            },
            AppError::Internal(msg) => Self {
                status: StatusCode::INTERNAL_SERVER_ERROR,
                error: msg,
                code: "INTERNAL_ERROR",
                headers: Vec::new(),
            },
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let mut response = (
            self.status,
            Json(ErrorEnvelope {
                error: &self.error,
                code: self.code,
            }),
        )
            .into_response();
        for (name, val) in self.headers {
            response.headers_mut().insert(name, val);
        }
        response
    }
}
