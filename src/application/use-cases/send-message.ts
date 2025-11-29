import { chain, map } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { messageCreate } from '~/domain/functions/message';
import type { TaskEither } from 'fp-ts/TaskEither';
import type { Conversation, ConversationId, Message, MessageRole } from '~/domain/types';

type SendMessageDeps = {
  readonly getConversation: (id: ConversationId) => TaskEither<Error, Conversation>;
  readonly saveMessage: (message: Message) => TaskEither<Error, Message>;
};

type SendMessageParams = {
  readonly conversationId: ConversationId;
  readonly role: MessageRole;
  readonly content: string;
};

export const sendMessageUseCase = (params: SendMessageParams, deps: SendMessageDeps): TaskEither<Error, Message> =>
  pipe(
    deps.getConversation(params.conversationId),
    map((conversation) =>
      messageCreate({ conversationId: conversation.id, role: params.role, content: params.content })
    ),
    chain((message) => deps.saveMessage(message))
  );
