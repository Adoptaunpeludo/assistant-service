import jwt from 'jsonwebtoken';
import { PayloadUser } from '../domain/interfaces/payload-user.interface';

export interface JWTAdapterPayload {
  user: PayloadUser;

  refreshToken?: string;
}

/**
 * JWT Adapter class for generating and validating JWT tokens.
 */
export class JWTAdapter {
  /**
   * Initializes a new instance of the JWTAdapter class.
   * @param seed The secret seed used for generating and validating tokens.
   */
  constructor(private readonly seed: string) {}

  /**
   * Generates a JWT token with the provided payload and duration.
   * @param payload The payload to be encoded into the token.
   * @param duration The duration for which the token will be valid. Defaults to '2h'.
   * @returns The generated JWT token.
   */
  public generateToken(
    payload: JWTAdapterPayload,

    duration: string = '2h'
  ) {
    return jwt.sign(payload, this.seed, { expiresIn: duration });
  }

  /**
   * Validates a JWT token and returns the decoded payload.
   * @param token The JWT token to be validated.
   * @returns The decoded payload from the token.
   */
  public validateToken(token: string): JWTAdapterPayload {
    return jwt.verify(token, this.seed) as JWTAdapterPayload;
  }
}
