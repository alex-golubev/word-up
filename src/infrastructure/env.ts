import {
  createConversationEffects,
  createMessageEffects,
  createOpenAIEffects,
  createUserEffects,
  createRefreshTokenEffects,
} from '~/infrastructure/effects';
import type { AppEnv } from '~/application/env';
import type { DBClient } from '~/infrastructure/db/client';
import type { OpenAiConfig } from '~/infrastructure/effects';

export type AppEnvConfig = {
  readonly db: DBClient;
  readonly openai: OpenAiConfig;
};

export const createAppEnv = (config: AppEnvConfig): AppEnv => {
  const conversationEffects = createConversationEffects(config.db);
  const messageEffects = createMessageEffects(config.db);
  const openAiEffects = createOpenAIEffects(config.openai);
  const userEffects = createUserEffects(config.db);
  const refreshTokenEffects = createRefreshTokenEffects(config.db);

  return {
    // Conversation & Message
    getConversation: conversationEffects.getConversation,
    saveConversation: conversationEffects.saveConversation,
    getMessagesByConversation: messageEffects.getMessagesByConversation,
    saveMessage: messageEffects.saveMessage,
    generateChatCompletion: openAiEffects.generateChatCompletion,
    generateChatCompletionStream: openAiEffects.generateChatCompletionStream,

    // User
    getUserById: userEffects.getUserById,
    getUserByEmail: userEffects.getUserByEmail,
    createUser: userEffects.createUser,
    updateUser: userEffects.updateUser,

    // Refresh Token
    saveRefreshToken: refreshTokenEffects.saveRefreshToken,
    getRefreshToken: refreshTokenEffects.getRefreshToken,
    deleteRefreshToken: refreshTokenEffects.deleteRefreshToken,
    deleteAllUserTokens: refreshTokenEffects.deleteAllUserTokens,
    tryMarkTokenAsUsed: refreshTokenEffects.tryMarkTokenAsUsed,
  };
};
