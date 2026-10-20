import axios from 'axios';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    const status = error.response?.status;
    if (!error.response) {
      return new ApiError('The safety service is unreachable. Check the API URL or use demo mode.');
    }
    if (status === 401) {
      return new ApiError(data?.message ?? 'Your session expired. Sign in again.', status);
    }
    return new ApiError(data?.message ?? 'The safety service could not complete that request.', status);
  }
  if (error instanceof Error) return new ApiError(error.message);
  return new ApiError('Something went wrong.');
}

export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}
