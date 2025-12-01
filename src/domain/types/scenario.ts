import { z } from 'zod';
import { LanguageSchema, ScenarioIdSchema, UserLevelSchema } from '~/domain/types/common';

export const ScenarioSchema = z.object({
  id: ScenarioIdSchema,
  title: z.string(),
  description: z.string(),
  role: z.string(),
  userLevel: UserLevelSchema,
  targetLanguage: LanguageSchema,
  startingMessage: z.string(),
  vocabulary: z.array(z.string()),
});

export type Scenario = z.infer<typeof ScenarioSchema>;
