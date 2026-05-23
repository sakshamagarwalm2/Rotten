import { z } from 'zod';

export const PptSettingsSchema = z.object({
  // Text Sizes
  fontSize: z.number().int().min(12).max(48),
  headingFontSize: z.number().int().min(16).max(60),
  
  // Spacing
  horizontalMargin: z.number().min(0).max(4),
  verticalMargin: z.number().min(0).max(3),
  lineSpacing: z.number().min(1).max(3),
  
  // Colors
  questionNoOptionNoColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid HEX color'),
  questionOptionColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid HEX color'),
  headingColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid HEX color'),
  yearColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid HEX color'),
  answerColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid HEX color'),
  
  // Display Options
  showAnswer: z.boolean(),
  showBulletPoints: z.boolean(),
  bulletStyle: z.enum(['disc', 'circle', 'square', 'number', 'letters', 'none']),
  
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
