import { publicProcedure, router } from '~/presentation/trpc/trpc';
import { z } from 'zod';
import { createConversationEffects } from '~/infrastructure/effects/conversation.effects';
import { makeScenarioId, makeUserId } from '~/domain/types';
import type { Language, UserLevel } from '~/domain/types';
import { createConversationUseCase } from '~/application/use-cases';

export const chatRouter = router({
  createConversation: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        scenarioId: z.string(),
        targetLanguage: z.string(),
        userLevel: z.enum(['beginner', 'intermediate', 'advanced']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversationEffects = createConversationEffects(ctx.db);
      const result = await createConversationUseCase(
        {
          userId: makeUserId(input.userId),
          scenarioId: makeScenarioId(input.scenarioId),
          targetLanguage: input.targetLanguage as Language,
          userLevel: input.userLevel as UserLevel,
        },
        { saveConversation: conversationEffects.saveConversation }
      )();

      return result;
    }),
});
