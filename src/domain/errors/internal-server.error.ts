import { HttpCodes } from '../../config';
import { CustomAPIError } from './custom-api.error';

/**
 * Represents an internal server error.
 */
export class InternalServerError extends CustomAPIError {
  /**
   * Creates an instance of InternalServerError.
   * @param message The error message.
   */
  constructor(public message: string) {
    super('Internal Server', message, HttpCodes.INTERNAL_SERVER_ERROR);
  }
}
