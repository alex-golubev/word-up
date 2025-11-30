import { ApplyPar, map } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { sequenceS } from 'fp-ts/Apply';
import type { Conversation, ConversationId, Message } from '~/domain/types';
import type { AppReader } from '~/application/reader';

export type ConversationWithMessages = Conversation & { readonly messages: readonly Message[] };

export const getConversationUseCase =
  (id: ConversationId): AppReader<ConversationWithMessages> =>
  (env) =>
    pipe(
      sequenceS(ApplyPar)({
        conversation: env.getConversation(id),
        messages: env.getMessagesByConversation(id),
      }),
      map(({ conversation, messages }) => ({ ...conversation, messages }))
    );
