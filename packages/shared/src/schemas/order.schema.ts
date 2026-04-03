import { z } from 'zod';

export const CreateOrderSchema = z.object({
  orgId: z.string().cuid(),
  tradePointId: z.string().cuid(),
  deliveryAddress: z.string().min(1),
  deliveryLat: z.number(),
  deliveryLng: z.number(),
  items: z.array(
    z.object({
      menuItemId: z.string().cuid(),
      quantity: z.number().int().min(1),
    })
  ).min(1),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'COOKING', 'READY', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED']),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;
