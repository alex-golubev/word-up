import type { DBClient } from '~/infrastructure/db/client';
import type { AppEnv } from '~/application/env';
import { createConversationEffects } from '~/infrastructure/effects';
import { createMessageEffects } from '~/infrastructure/effects';

export const createAppEnv = (db: DBClient): AppEnv => {
  const conversationEffects = createConversationEffects(db);
  const messageEffects = createMessageEffects(db);

  return {
    getConversation: conversationEffects.getConversation,
    saveConversation: conversationEffects.saveConversation,
    getMessagesByConversation: messageEffects.getMessagesByConversation,
    saveMessage: messageEffects.saveMessage,
  };
};
