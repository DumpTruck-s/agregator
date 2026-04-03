import { z } from 'zod';

export const StartShiftSchema = z.object({
  deliveryZoneLat: z.number(),
  deliveryZoneLng: z.number(),
  deliveryRadiusKm: z.number().positive(),
});

export type StartShiftDto = z.infer<typeof StartShiftSchema>;
