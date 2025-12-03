import { z } from 'zod';
import { publicProcedure, router } from '~/presentation/trpc/trpc';
import {
  ConversationIdSchema,
  LanguageSchema,
  MessageContentSchema,
  MessageRoleSchema,
  ScenarioIdSchema,
  ScenarioSchema,
  UserIdSchema,
  UserLevelSchema,
} from '~/domain/types';
import type { StreamEvent } from '~/domain/types';
import {
  createConversationUseCase,
  generateResponseUseCase,
  generateResponseStreamUseCase,
  getConversationUseCase,
  sendMessageUseCase,
} from '~/application/use-cases';
import { safeHandler } from '~/presentation/trpc/errors';

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

const GenerateResponseInputSchema = z.object({
  conversationId: ConversationIdSchema,
  scenario: ScenarioSchema,
});

export const chatRouter = router({
  createConversation: publicProcedure
    .input(CreateConversationInputSchema)
    .mutation(safeHandler(({ ctx, input }) => createConversationUseCase(input)(ctx.env))),

  getConversation: publicProcedure
    .input(GetConversationInputSchema)
    .query(safeHandler(({ ctx, input }) => getConversationUseCase(input.conversationId)(ctx.env))),

  sendMessage: publicProcedure
    .input(SendMessageInputSchema)
    .mutation(safeHandler(({ ctx, input }) => sendMessageUseCase(input)(ctx.env))),

  generateResponse: publicProcedure
    .input(GenerateResponseInputSchema)
    .mutation(safeHandler(({ ctx, input }) => generateResponseUseCase(input)(ctx.env))),

  generateResponseStream: publicProcedure.input(GenerateResponseInputSchema).mutation(async function* ({
    ctx,
    input,
  }): AsyncGenerator<StreamEvent> {
    yield* generateResponseStreamUseCase(input, ctx.env);
  }),
});
