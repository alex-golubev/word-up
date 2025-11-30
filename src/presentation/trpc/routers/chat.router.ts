import { z } from 'zod';
import { publicProcedure, router } from '~/presentation/trpc/trpc';
import { createConversationEffects } from '~/infrastructure/effects/conversation.effects';
import {
  ConversationIdSchema,
  LanguageSchema,
  MessageContentSchema,
  MessageRoleSchema,
  ScenarioIdSchema,
  UserIdSchema,
  UserLevelSchema,
} from '~/domain/types';
import { createConversationUseCase, getConversationUseCase, sendMessageUseCase } from '~/application/use-cases';
import { safeHandler } from '~/presentation/trpc/errors';
import { createMessageEffects } from '~/infrastructure/effects';

const CreateConversationInputSchema = z.object({
  userId: UserIdSchema,
  scenarioId: ScenarioIdSchema,
  targetLanguage: LanguageSchema,
  userLevel: UserLevelSchema,
});

const GetConversationInputSchema = z.object({ conversationId: ConversationIdSchema });

const SendMessageInputSchema = z.object({
  conversationId: ConversationIdSchema,
  role: MessageRoleSchema,
  content: MessageContentSchema,
});

export const chatRouter = router({
  createConversation: publicProcedure
    .input(CreateConversationInputSchema)
    .mutation(
      safeHandler(({ ctx, input }) =>
        createConversationUseCase(input, { saveConversation: createConversationEffects(ctx.db).saveConversation })
      )
    ),

  getConversation: publicProcedure.input(GetConversationInputSchema).mutation(
    safeHandler(({ ctx, input }) =>
      getConversationUseCase(input.conversationId, {
        getConversation: createConversationEffects(ctx.db).getConversation,
        getMessagesByConversation: createMessageEffects(ctx.db).getMessagesByConversation,
      })
    )
  ),

  sendMessage: publicProcedure.input(SendMessageInputSchema).mutation(
    safeHandler(({ ctx, input }) =>
      sendMessageUseCase(input, {
        getConversation: createConversationEffects(ctx.db).getConversation,
        saveMessage: createMessageEffects(ctx.db).saveMessage,
      })
    )
  ),
});
