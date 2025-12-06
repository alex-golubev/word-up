import { z } from 'zod';

import {
  createConversationUseCase,
  generateResponseFromHistoryUseCase,
  generateSpeechUseCase,
  getConversationUseCase,
  saveMessagesUseCase,
} from '~/application/use-cases';
import {
  ChatMessageSchema,
  ConversationIdSchema,
  LanguageSchema,
  MessageContentSchema,
  MessageRoleSchema,
  ScenarioIdSchema,
  ScenarioSchema,
  SpeechVoiceSchema,
  UserIdSchema,
  UserLevelSchema,
} from '~/domain/types';
import { safeHandler } from '~/presentation/trpc/errors';
import { publicProcedure, router } from '~/presentation/trpc/trpc';

const CreateConversationInputSchema = z.object({
  userId: UserIdSchema,
  scenarioId: ScenarioIdSchema,
  targetLanguage: LanguageSchema,
  userLevel: UserLevelSchema,
});

const GetConversationInputSchema = z.object({ conversationId: ConversationIdSchema });

const GenerateSpeechInputSchema = z.object({
  text: MessageContentSchema,
  voice: SpeechVoiceSchema.optional(),
});

const GenerateResponseFromHistoryInputSchema = z.object({
  scenario: ScenarioSchema,
  history: z.array(ChatMessageSchema),
  userMessage: MessageContentSchema,
});

const SaveMessageItemSchema = z.object({
  role: MessageRoleSchema,
  content: MessageContentSchema,
  createdAt: z.coerce.date(),
});

const SaveMessagesInputSchema = z.object({
  conversationId: ConversationIdSchema,
  messages: z.array(SaveMessageItemSchema),
});

export const chatRouter = router({
  createConversation: publicProcedure
    .input(CreateConversationInputSchema)
    .mutation(safeHandler(({ ctx, input }) => createConversationUseCase(input)(ctx.env))),

  getConversation: publicProcedure
    .input(GetConversationInputSchema)
    .query(safeHandler(({ ctx, input }) => getConversationUseCase(input.conversationId)(ctx.env))),

  generateSpeech: publicProcedure
    .input(GenerateSpeechInputSchema)
    .mutation(safeHandler(({ ctx, input }) => generateSpeechUseCase(input)(ctx.env))),

  generateResponseFromHistory: publicProcedure
    .input(GenerateResponseFromHistoryInputSchema)
    .mutation(safeHandler(({ ctx, input }) => generateResponseFromHistoryUseCase(input)(ctx.env))),

  saveMessages: publicProcedure
    .input(SaveMessagesInputSchema)
    .mutation(safeHandler(({ ctx, input }) => saveMessagesUseCase(input)(ctx.env))),
});
