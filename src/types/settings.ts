import { z } from 'zod';

export const PptSettingsSchema = z.object({
  fontSize: z.number().int().min(12).max(32),
  questionGap: z.number().int().min(5).max(50),
  questionOptionColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid HEX color'),
  yearColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid HEX color'),
  showAnswer: z.boolean(),
  contentArea: z.object({
    top: z.number(),
    left: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  backgroundImage: z.string().optional(),
});

export type PptSettings = z.infer<typeof PptSettingsSchema>;
