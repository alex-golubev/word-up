import { publicProcedure, router } from '~/presentation/trpc/trpc';
import { z } from 'zod';
import { createConversationEffects } from '~/infrastructure/effects/conversation.effects';
import { LanguageSchema, ScenarioIdSchema, UserIdSchema, UserLevelSchema } from '~/domain/types';
import { createConversationUseCase } from '~/application/use-cases';
import { safeHandler } from '~/presentation/trpc/errors';

const CreateConversationInputSchema = z.object({
  userId: UserIdSchema,
  scenarioId: ScenarioIdSchema,
  targetLanguage: LanguageSchema,
  userLevel: UserLevelSchema,
});

export const chatRouter = router({
  createConversation: publicProcedure
    .input(CreateConversationInputSchema)
    .mutation(
      safeHandler(({ ctx, input }) =>
        createConversationUseCase(input, { saveConversation: createConversationEffects(ctx.db).saveConversation })
      )
    ),
});
