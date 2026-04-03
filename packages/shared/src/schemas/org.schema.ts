import { z } from 'zod';

export const CreateOrgSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const CreateTradePointSchema = z.object({
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  deliveryRadiusKm: z.number().positive(),
});

export const CreateMenuCategorySchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

export const CreateMenuItemSchema = z.object({
  categoryId: z.string().cuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  image: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
});

export type CreateOrgDto = z.infer<typeof CreateOrgSchema>;
export type CreateTradePointDto = z.infer<typeof CreateTradePointSchema>;
export type CreateMenuCategoryDto = z.infer<typeof CreateMenuCategorySchema>;
export type CreateMenuItemDto = z.infer<typeof CreateMenuItemSchema>;
