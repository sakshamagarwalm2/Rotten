import { PptSettingsSchema } from '../types/settings';

export const defaultSettings = PptSettingsSchema.parse({
  fontSize: 18,
  questionGap: 15,
  questionOptionColor: '#000000',
  yearColor: '#666666',
  showAnswer: false,
  contentArea: {
    top: 0.5,
    left: 0.5,
    width: 9,
    height: 5.5,
  },
});
