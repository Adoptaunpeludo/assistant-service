import { HttpCodes } from '../../config/http-status-codes.adapter';
import { CustomAPIError } from './custom-api.error';

/**
 * Custom error class representing a BadRequestError.
 */
export class BadRequestError extends CustomAPIError {
  /**
   * Creates an instance of BadRequestError.
   * @param message The error message.
   */
  constructor(public message: string) {
    super('Bad Request', message, HttpCodes.BAD_REQUEST);
  }
}
