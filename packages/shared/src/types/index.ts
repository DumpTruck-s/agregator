export type Role = 'OWNER' | 'COURIER' | 'CUSTOMER' | 'ADMIN';

export type OrderStatus =
  | 'CREATED'
  | 'ACCEPTED'
  | 'COOKING'
  | 'READY'
  | 'PICKED_UP'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED';

export interface JwtPayload {
  sub: string;   // userId
  role: Role;
  email: string;
}

export interface ApiError {
  message: string;
  code?: string;
}
