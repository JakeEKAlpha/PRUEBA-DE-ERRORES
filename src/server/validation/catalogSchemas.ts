import { z } from 'zod';

export const createEngineerSchema = z.object({
  id: z.string().trim().min(1).max(64).optional(),
  nombreCompleto: z
    .string()
    .trim()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres.')
    .max(150),
  nombreCorto: z
    .string()
    .trim()
    .min(2, 'El mote/nombre corto debe tener al menos 2 caracteres.')
    .max(50),
  sucursalAdscripcion: z
    .string()
    .trim()
    .min(2, 'La sucursal de adscripción es obligatoria.')
    .max(120),
  entidadRegion: z.string().trim().min(2).max(100).optional(),
  activo: z.boolean().optional(),
});

export const updateEngineerSchema = z
  .object({
    nombreCompleto: z
      .string()
      .trim()
      .min(2, 'El nombre completo debe tener al menos 2 caracteres.')
      .max(150)
      .optional(),
    nombreCorto: z
      .string()
      .trim()
      .min(2, 'El mote/nombre corto debe tener al menos 2 caracteres.')
      .max(50)
      .optional(),
    sucursalAdscripcion: z
      .string()
      .trim()
      .min(2, 'La sucursal de adscripción es obligatoria.')
      .max(120)
      .optional(),
    entidadRegion: z.string().trim().min(2).max(100).optional(),
    activo: z.boolean().optional(),
  })
  .refine(
    (val) =>
      val.nombreCompleto !== undefined ||
      val.nombreCorto !== undefined ||
      val.sucursalAdscripcion !== undefined ||
      val.entidadRegion !== undefined ||
      val.activo !== undefined,
    { message: 'Debe incluir al menos un campo para actualizar.' }
  );
