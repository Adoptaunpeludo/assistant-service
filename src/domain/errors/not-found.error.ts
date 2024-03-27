import { HttpCodes } from '../../config/http-status-codes.adapter';
import { CustomAPIError } from './custom-api.error';

/**
 * Represents a not found error.
 */
export class NotFoundError extends CustomAPIError {
  /**
   * Creates an instance of NotFoundError.
   * @param message The error message.
   */
  constructor(public message: string) {
    super('Not Found', message, HttpCodes.NOT_FOUND);
  }
}
