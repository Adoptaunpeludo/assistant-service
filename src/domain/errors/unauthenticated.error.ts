import { HttpCodes } from '../../config/http-status-codes.adapter';
import { CustomAPIError } from './custom-api.error';

/**
 * Represents an unauthenticated error.
 */
export class UnauthenticatedError extends CustomAPIError {
  /**
   * Creates an instance of UnauthenticatedError.
   * @param message The error message.
   */
  constructor(public message: string) {
    super('Unauthenticated', message, HttpCodes.UNAUTHORIZED);
  }
}
