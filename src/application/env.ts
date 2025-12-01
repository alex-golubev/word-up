import type { TaskEither } from 'fp-ts/TaskEither';
import type { AppError, ChatMessage, Conversation, ConversationId, GenerateResponse, Message } from '~/domain/types';

export type AppEnv = {
  readonly getConversation: (id: ConversationId) => TaskEither<AppError, Conversation>;
  readonly getMessagesByConversation: (id: ConversationId) => TaskEither<AppError, readonly Message[]>;
  readonly saveConversation: (conversation: Conversation) => TaskEither<AppError, Conversation>;
  readonly saveMessage: (message: Message) => TaskEither<AppError, Message>;
  readonly generateChatCompletion: (messages: readonly ChatMessage[]) => TaskEither<AppError, GenerateResponse>;
};
