import { NextFunction, Request, Response } from 'express';

import { CustomAPIError } from '../../domain/errors';
import { HttpCodes } from '../../config/http-status-codes.adapter';
import { MulterError } from 'multer';

/**
 * Middleware class for handling errors.
 */
export class ErrorHandlerMiddleware {
  /**
   * Handles errors and sends appropriate responses.
   */
  static handle(err: Error, _req: Request, res: Response, _next: NextFunction) {
    console.log({ err });

    let message, statusCode;

    // Handle unknown errors
    if (!err || err === null) {
      statusCode = 500;
      message = 'Unknown error';
    }

    // Handle CustomAPIError
    if (err instanceof CustomAPIError) {
      statusCode = err.statusCode;
      message = err.message;
    }

    // Handle MulterError
    if (err instanceof MulterError) {
      statusCode = HttpCodes.BAD_REQUEST;
      message = err.message;
    }

    return res.status(statusCode || HttpCodes.INTERNAL_SERVER_ERROR).json({
      name: err?.name || 'Error',
      message: message || err?.message,
    });
  }
}
