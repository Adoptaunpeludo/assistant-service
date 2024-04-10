import { NextFunction, Request, Response } from 'express';

import { AttachCookiesToResponse } from '../../utils/response-cookies';
import { UnauthenticatedError, UnauthorizedError } from '../../domain/errors';
import { JWTAdapter } from '../../config/jwt.adapter';
import { UserRoles } from '../../domain/interfaces/payload-user.interface';

/**
 * Middleware class for authentication and authorization.
 */
export class AuthMiddleware {
  /**
   * Constructs an instance of AuthMiddleware.
   * @param jwt - Instance of JWTAdapter for handling JSON Web Tokens.
   */
  constructor(private readonly jwt: JWTAdapter) {}

  /**
   * Middleware for authenticating user requests.
   */
  public authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const bearer = req.headers.authorization;

    if (!bearer || !bearer.startsWith('Bearer '))
      throw new UnauthenticatedError('Please first login');

    const token = bearer.split(' ').at(-1);

    if (!token) throw new UnauthenticatedError('Token not present');

    const payload = this.jwt.validateToken(token);
    if (!payload) throw new UnauthorizedError('Invalid token validation');
    req.user = payload.user;
    return next();
  };

  /**
   * Middleware for authorizing user permissions based on roles.
   * @param roles - Roles allowed to access the resource.
   */
  public authorizePermissions = (...roles: UserRoles[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const { role } = req.user;

      if (role === 'admin') return next();

      if (!roles.includes(role!))
        throw new UnauthorizedError('Unauthorized to access this resource');

      next();
    };
  };
}
