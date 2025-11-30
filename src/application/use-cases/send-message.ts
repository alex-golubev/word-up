import { chain, map } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { messageCreate } from '~/domain/functions/message';
import type { ConversationId, Message, MessageRole } from '~/domain/types';
import type { AppReader } from '~/application/reader';

export type SendMessageParams = {
  readonly conversationId: ConversationId;
  readonly role: MessageRole;
  readonly content: string;
};

export const sendMessageUseCase =
  (params: SendMessageParams): AppReader<Message> =>
  (env) =>
    pipe(
      env.getConversation(params.conversationId),
      map((conversation) =>
        messageCreate({ conversationId: conversation.id, role: params.role, content: params.content })
      ),
      chain((message) => env.saveMessage(message))
    );
