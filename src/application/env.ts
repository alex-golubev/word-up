import type { TaskEither } from 'fp-ts/TaskEither';
import type {
  AppError,
  ChatMessage,
  Conversation,
  ConversationId,
  GenerateResponse,
  Language,
  Message,
  RefreshToken,
  User,
  UserId,
  UserCreateParams,
} from '~/domain/types';
import type { ChatCompletionStream } from '~/infrastructure/effects/openai.effects';

export type AppEnv = {
  readonly getConversation: (id: ConversationId) => TaskEither<AppError, Conversation>;
  readonly getMessagesByConversation: (id: ConversationId) => TaskEither<AppError, readonly Message[]>;
  readonly saveConversation: (conversation: Conversation) => TaskEither<AppError, Conversation>;
  readonly saveMessage: (message: Message) => TaskEither<AppError, Message>;
  readonly generateChatCompletion: (messages: readonly ChatMessage[]) => TaskEither<AppError, GenerateResponse>;
  readonly generateChatCompletionStream: (
    messages: readonly ChatMessage[],
    signal?: AbortSignal
  ) => TaskEither<AppError, ChatCompletionStream>;

  readonly getUserById: (id: UserId) => TaskEither<AppError, User>;
  readonly getUserByEmail: (email: string) => TaskEither<AppError, User | null>;
  readonly createUser: (params: UserCreateParams) => TaskEither<AppError, User>;
  readonly updateUser: (
    id: UserId,
    data: { name?: string | null; nativeLanguage?: Language }
  ) => TaskEither<AppError, User>;

  readonly saveRefreshToken: (userId: UserId, token: string, expiresAt: Date) => TaskEither<AppError, RefreshToken>;
  readonly getRefreshToken: (token: string) => TaskEither<AppError, RefreshToken | null>;
  readonly deleteRefreshToken: (token: string) => TaskEither<AppError, void>;
  readonly deleteAllUserTokens: (userId: UserId) => TaskEither<AppError, void>;
  readonly tryMarkTokenAsUsed: (
    token: string,
    replacementToken: string
  ) => TaskEither<AppError, { marked: boolean; record: RefreshToken }>;
};
