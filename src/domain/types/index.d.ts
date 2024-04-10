import { PayloadUser } from '../interfaces/payload-user.interface';

export {};

declare global {
  namespace Express {
    interface Request {
      user: PayloadUser;
    }
  }
}
