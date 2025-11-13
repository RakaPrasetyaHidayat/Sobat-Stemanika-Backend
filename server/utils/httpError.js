export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    if (details !== undefined) this.details = details;
  }
}

export const isHttpError = (error) => error instanceof HttpError;

export const toHttpError = (error, defaultStatus = 500) => {
  if (isHttpError(error)) return error;
  const message = error?.message || "Server error";
  return new HttpError(defaultStatus, message);
};
