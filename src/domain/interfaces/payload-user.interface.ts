export type UserRoles = 'admin' | 'adopter' | 'shelter';
export interface PayloadUser {
  id?: string;
  name?: string;
  email: string;
  role?: UserRoles;
  wsToken?: string;
}
