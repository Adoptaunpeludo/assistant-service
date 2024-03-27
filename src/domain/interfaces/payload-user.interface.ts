import { UserRoles } from './user-response.interface';

export interface PayloadUser {
  id?: string;
  name?: string;
  email: string;
  role?: UserRoles;
  wsToken?: string;
}
