export interface APIHeaders {
  Authorization?: string;
  'X-Request-ID'?: string;
}

export interface APIErrorDetails {
  code: string;
  message: string;
  details?: any;
}