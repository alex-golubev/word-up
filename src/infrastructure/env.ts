import { createConversationEffects, createOpenAIEffects } from '~/infrastructure/effects';
import { createMessageEffects } from '~/infrastructure/effects';
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

  return {
    getConversation: conversationEffects.getConversation,
    saveConversation: conversationEffects.saveConversation,
    getMessagesByConversation: messageEffects.getMessagesByConversation,
    saveMessage: messageEffects.saveMessage,
    generateChatCompletion: openAiEffects.generateChatCompletion,
  };
};
