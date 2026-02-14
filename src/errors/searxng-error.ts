export class SearxngError extends Error {
  readonly status: number;
  readonly retryAfter?: number;

  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = "SearxngError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}
