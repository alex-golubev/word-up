import type { ConversationId, MessageId, MessageRole } from '~/domain/types/common';

export type Message = {
  readonly id: MessageId;
  readonly conversationId: ConversationId;
  readonly role: MessageRole;
  readonly content: string;
  readonly timestamp: Date;
};

export type Correction = {
  readonly original: string;
  readonly corrected: string;
  readonly explanation: string;
};

export type VocabularyItem = {
  readonly word: string;
  readonly translation: string;
  readonly context: string;
};
