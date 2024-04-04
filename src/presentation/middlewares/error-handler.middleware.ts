import { NextFunction, Request, Response } from 'express';

import { CustomAPIError } from '../../domain/errors';
import { HttpCodes } from '../../config/http-status-codes.adapter';
import { MulterError } from 'multer';
import { QueueService } from '../services/queue.service';
import { envs } from '../../config/envs';

/**
 * Middleware class for handling errors.
 */
export class ErrorHandlerMiddleware {
  errorLogsService: QueueService = new QueueService(
    envs.RABBITMQ_URL,
    'error-notification'
  );
  /**
   * Handles errors and sends appropriate responses.
   */
  handle(err: Error, _req: Request, res: Response, _next: NextFunction) {
    console.log({ err });

    let message, statusCode;

    // Handle unknown errors
    if (!err || err === null) {
      statusCode = 500;
      message = 'Unknown error';
    }

    // Handle jwt expired errors
    if (err?.name && err?.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'JWT token expired';
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

    this.errorLogsService.addMessageToQueue(
      {
        message: message,
        level: statusCode === 500 ? 'high' : 'medium',
        origin: 'assistant-service',
      },
      'error-logs'
    );

    return res.status(statusCode || HttpCodes.INTERNAL_SERVER_ERROR).json({
      name: err?.name || 'Error',
      message: message || err?.message,
    });
  }
}
