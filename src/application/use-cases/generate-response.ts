import { pipe } from 'fp-ts/function';
import { chain, map } from 'fp-ts/TaskEither';
import { messageCreate } from '~/domain/functions/message';
import type { AppReader } from '~/application/reader';
import type { ChatMessage, ConversationId, Message, Scenario } from '~/domain/types';

export type GenerateResponseParams = {
  readonly conversationId: ConversationId;
  readonly scenario: Scenario;
};

const buildSystemPrompt = (scenario: Scenario): string =>
  `You are a language learning assistant helping a user practice ${scenario.targetLanguage}.

Scenario: ${scenario.title}
${scenario.description}

Your role: ${scenario.role}

Guidelines:
- Stay in character for the scenario
- Use simple language appropriate for the user's level
- If the user makes mistakes, gently correct them
- Keep responses concise and conversational
- Encourage the user to practice speaking`;

const buildChatMessages = (scenario: Scenario, messages: readonly Message[]): readonly ChatMessage[] => [
  { role: 'system', content: buildSystemPrompt(scenario) },
  ...messages.map((m) => ({ role: m.role, content: m.content })),
];

export const generateResponseUseCase =
  (params: GenerateResponseParams): AppReader<Message> =>
  (env) =>
    pipe(
      env.getMessagesByConversation(params.conversationId),
      map((messages) => buildChatMessages(params.scenario, messages)),
      chain((chatMessages) => env.generateChatCompletion(chatMessages)),
      map(({ content }) => messageCreate({ conversationId: params.conversationId, role: 'assistant', content })),
      chain((message) => env.saveMessage(message))
    );
