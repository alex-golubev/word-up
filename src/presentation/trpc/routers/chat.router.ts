import { z } from 'zod';
import { publicProcedure, router } from '~/presentation/trpc/trpc';
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
import { createAppEnv } from '~/infrastructure/env';

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
    .mutation(safeHandler(({ ctx, input }) => createConversationUseCase(input)(createAppEnv(ctx.db)))),

  getConversation: publicProcedure
    .input(GetConversationInputSchema)
    .query(safeHandler(({ ctx, input }) => getConversationUseCase(input.conversationId)(createAppEnv(ctx.db)))),

  sendMessage: publicProcedure
    .input(SendMessageInputSchema)
    .mutation(safeHandler(({ ctx, input }) => sendMessageUseCase(input)(createAppEnv(ctx.db)))),
});
