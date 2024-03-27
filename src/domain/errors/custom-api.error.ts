/**
 * Custom error class representing an API error.
 */
export class CustomAPIError extends Error {
  /**
   * Creates an instance of CustomAPIError.
   * @param name The name of the error.
   * @param message The error message.
   * @param statusCode The HTTP status code associated with the error.
   */
  constructor(
    public name: string,
    public message: string,
    public statusCode: number
  ) {
    super(message);
  }
}
