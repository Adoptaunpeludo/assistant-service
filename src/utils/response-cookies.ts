import { Response } from 'express';
import { envs } from '../config/envs';

interface Options {
  res: Response;
  accessToken: string;
  refreshToken: string;
}

/**
 * Utility class for attaching cookies to the response.
 */
export class AttachCookiesToResponse {
  /**
   * Method to attach access and refresh tokens as cookies to the response.
   * @param options - Object containing response object and token values.
   */
  static attach({ res, accessToken, refreshToken }: Options) {
    // Define cookie expiration times
    const oneMinute = 1000 * 60;
    const oneDay = 1000 * 60 * 60 * 24;

    // Attach access token cookie to the response
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: envs.NODE_ENV === 'production',
      signed: true,
      expires: new Date(Date.now() + oneMinute),
    });

    // Attach refresh token cookie to the response
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: envs.NODE_ENV === 'production',
      signed: true,
    });
  }
}
