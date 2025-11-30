import { ApplyPar, map } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { sequenceS } from 'fp-ts/Apply';
import type { AppError, Conversation, ConversationId, Message } from '~/domain/types';
import type { TaskEither } from 'fp-ts/TaskEither';

type GetConversationDeps = {
  readonly getConversation: (id: ConversationId) => TaskEither<AppError, Conversation>;
  readonly getMessagesByConversation: (id: ConversationId) => TaskEither<AppError, readonly Message[]>;
};

type ConversationWithMessages = Conversation & { readonly messages: readonly Message[] };

export const getConversationUseCase = (
  id: ConversationId,
  deps: GetConversationDeps
): TaskEither<AppError, ConversationWithMessages> =>
  pipe(
    sequenceS(ApplyPar)({
      conversation: deps.getConversation(id),
      messages: deps.getMessagesByConversation(id),
    }),
    map(({ conversation, messages }) => ({ ...conversation, messages }))
  );
