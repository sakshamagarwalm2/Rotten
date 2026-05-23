import { PptSettingsSchema } from '../types/settings';

export const defaultSettings = PptSettingsSchema.parse({
  fontSize: 20,
  headingFontSize: 32,
  questionGap: 15,
  lineSpacing: 1.5,
  questionOptionColor: '#000000',
  headingColor: '#1a1a1a',
  yearColor: '#e02424',
  answerColor: '#16a34a',
  showAnswer: true,
  showBulletPoints: true,
  bulletStyle: 'disc',
  contentArea: {
    top: 0.5,
    left: 0.5,
    width: 9,
    height: 5.5,
  },
});
