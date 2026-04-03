import { OrderStatus, Role } from '@delivery/shared';
import { ForbiddenError, AppError } from '../../shared/errors';

type Transition = { from: OrderStatus[]; allowedRoles: Role[] };

const TRANSITIONS: Record<OrderStatus, Transition | null> = {
  CREATED:    null,
  ACCEPTED:   { from: ['CREATED'],    allowedRoles: ['COURIER'] },
  COOKING:    { from: ['ACCEPTED'],   allowedRoles: ['OWNER'] },
  READY:      { from: ['COOKING'],    allowedRoles: ['OWNER'] },
  PICKED_UP:  { from: ['READY'],      allowedRoles: ['COURIER'] },
  DELIVERING: { from: ['PICKED_UP'],  allowedRoles: ['COURIER'] },
  DELIVERED:  { from: ['DELIVERING'], allowedRoles: ['COURIER'] },
  CANCELLED:  { from: ['CREATED', 'ACCEPTED', 'COOKING'], allowedRoles: ['CUSTOMER', 'OWNER', 'ADMIN'] },
};

export function assertTransition(from: OrderStatus, to: OrderStatus, role: Role) {
  const rule = TRANSITIONS[to];
  if (!rule) throw new AppError(`Cannot transition to ${to}`, 400);
  if (!rule.from.includes(from)) {
    throw new AppError(`Cannot go from ${from} to ${to}`, 400);
  }
  if (!rule.allowedRoles.includes(role)) {
    throw new ForbiddenError(`Role ${role} cannot set status ${to}`);
  }
}
