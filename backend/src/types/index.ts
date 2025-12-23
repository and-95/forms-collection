export type Role = 'admin' | 'superadmin';

export interface User {
  id: string;
  login: string;
  password_hash: string;
  role: Role;
  must_change_password: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  sub: string; // user.id
  role: Role;
}