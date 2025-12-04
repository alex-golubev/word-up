import { pipe } from 'fp-ts/function';
import { map } from 'fp-ts/TaskEither';
import type { AppReader } from '~/application/reader';
import type { ChatMessage, Scenario } from '~/domain/types';

export type GenerateResponseFromHistoryParams = {
  readonly scenario: Scenario;
  readonly history: readonly ChatMessage[];
  readonly userMessage: string;
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

export const generateResponseFromHistoryUseCase =
  (params: GenerateResponseFromHistoryParams): AppReader<{ content: string }> =>
  (env) => {
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(params.scenario) },
      ...params.history,
      { role: 'user', content: params.userMessage },
    ];

    return pipe(
      env.generateChatCompletion(chatMessages),
      map(({ content }) => ({ content }))
    );
  };
