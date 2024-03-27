import { HttpCodes } from '../../config/http-status-codes.adapter';
import { CustomAPIError } from './custom-api.error';

/**
 * Represents an unauthorized error.
 */
export class UnauthorizedError extends CustomAPIError {
  /**
   * Creates an instance of UnauthorizedError.
   * @param message The error message.
   */
  constructor(public message: string) {
    super('Unauthorized', message, HttpCodes.FORBIDDEN);
  }
}
