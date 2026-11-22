export type ApiErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'rate_limited'
  | 'upstream'
  | 'network'
  | 'unknown';

export interface ApiFailure {
  readonly ok: false;
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly message: string;
  readonly retryable: boolean;
}

export interface ApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
  readonly warnings?: string[];
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export interface HttpErrorLike {
  readonly status: number;
  readonly message?: unknown;
  readonly error?: unknown;
}

export function isHttpErrorLike(err: unknown): err is HttpErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof (err as { status: unknown }).status === 'number'
  );
}

export function apiOk<T>(data: T, warnings?: string[]): ApiSuccess<T> {
  return warnings && warnings.length > 0 ? { ok: true, data, warnings } : { ok: true, data };
}

export function apiErr(
  kind: ApiErrorKind,
  status: number,
  message: string,
  retryable: boolean
): ApiFailure {
  return { ok: false, kind, status, message, retryable };
}

export function mapHttpErrorToApiFailure(
  err: unknown,
  fallbackMessage: string = 'Request failed.'
): ApiFailure {
  if (isHttpErrorLike(err)) {
    const detail = extractErrorDetail(err.error);
    const errMessage = typeof err.message === 'string' ? err.message : '';
    const message = detail || errMessage || fallbackMessage;

    if (err.status === 401) {
      return apiErr('unauthorized', 401, message, false);
    }
    if (err.status === 403) {
      return apiErr('forbidden', 403, message, false);
    }
    if (err.status === 422) {
      return apiErr('validation', 422, message, false);
    }
    if (err.status === 429) {
      return apiErr('rate_limited', 429, message, true);
    }
    if (err.status === 502 || err.status === 503 || err.status === 504) {
      return apiErr('upstream', err.status, message, true);
    }
    if (err.status === 0) {
      return apiErr('network', 0, fallbackMessage, true);
    }
    return apiErr('unknown', err.status, message, err.status >= 500);
  }

  if (err instanceof Error && err.message) {
    return apiErr('unknown', 0, err.message, true);
  }
  return apiErr('unknown', 0, fallbackMessage, true);
}

function extractErrorDetail(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === 'string') return payload.trim() || null;
  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidate = record['detail'] ?? record['error'] ?? record['message'];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}
