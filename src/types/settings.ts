import { z } from 'zod';

export const PptSettingsSchema = z.object({
  // Text Sizes
  fontSize: z.number().int().min(12).max(48),
  headingFontSize: z.number().int().min(16).max(60),
  
  // Spacing
  questionGap: z.number().int().min(5).max(50),
  lineSpacing: z.number().min(1).max(3),
  
  // Colors
  questionOptionColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid HEX color'),
  headingColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid HEX color'),
  yearColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid HEX color'),
  answerColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid HEX color'),
  
  // Display Options
  showAnswer: z.boolean(),
  showBulletPoints: z.boolean(),
  bulletStyle: z.enum(['disc', 'circle', 'square', 'number', 'none']),
  
  // Layout
  contentArea: z.object({
    top: z.number(),
    left: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  
  backgroundImage: z.string().optional(),
});

export type PptSettings = z.infer<typeof PptSettingsSchema>;
