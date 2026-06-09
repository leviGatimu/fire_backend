import { Request } from 'express';

export type Role = 'ADMIN' | 'INSPECTOR' | 'USER';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: Role;
  type: 'access' | 'refresh';
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
