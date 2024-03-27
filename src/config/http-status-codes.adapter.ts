import { StatusCodes } from 'http-status-codes';

export class HttpCodes {
  /**
   * Returns the HTTP status code for OK (200).
   */
  static get OK(): number {
    return StatusCodes.OK;
  }

  /**
   * Returns the HTTP status code for Created (201).
   */
  static get CREATED(): number {
    return StatusCodes.CREATED;
  }

  /**
   * Returns the HTTP status code for Not Found (404).
   */
  static get NOT_FOUND(): number {
    return StatusCodes.NOT_FOUND;
  }

  /**
   * Returns the HTTP status code for Bad Request (400).
   */
  static get BAD_REQUEST(): number {
    return StatusCodes.BAD_REQUEST;
  }

  /**
   * Returns the HTTP status code for Unauthorized (401).
   */
  static get UNAUTHORIZED(): number {
    return StatusCodes.UNAUTHORIZED;
  }

  /**
   * Returns the HTTP status code for Forbidden (403).
   */
  static get FORBIDDEN(): number {
    return StatusCodes.FORBIDDEN;
  }

  /**
   * Returns the HTTP status code for Internal Server Error (500).
   */
  static get INTERNAL_SERVER_ERROR(): number {
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
}
