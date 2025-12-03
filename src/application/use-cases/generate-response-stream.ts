import { isLeft } from 'fp-ts/Either';
import { messageCreate } from '~/domain/functions/message';
import type { AppEnv } from '~/application/env';
import type { ChatMessage, ConversationId, Message, Scenario, StreamEvent } from '~/domain/types';
import { getErrorMessage } from '~/domain/types';

export type GenerateResponseStreamParams = {
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

/**
 * Streaming use case for generating AI responses.
 *
 * Note: This use case does NOT follow the Reader pattern because async generators
 * are fundamentally incompatible with TaskEither. Instead, `env` is passed directly
 * as a parameter.
 *
 * @param signal - Optional AbortSignal to cancel the stream. When aborted:
 *   - OpenAI request is cancelled (saves tokens)
 *   - No message is saved to DB
 *   - Generator returns early without error
 */
export const generateResponseStreamUseCase = (
  params: GenerateResponseStreamParams,
  env: AppEnv,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent, void, undefined> => {
  return (async function* () {
    // Step 1: Fetch messages
    const messagesResult = await env.getMessagesByConversation(params.conversationId)();
    if (isLeft(messagesResult)) {
      yield { type: 'error', error: getErrorMessage(messagesResult.left) };
      return;
    }
    const messages = messagesResult.right;

    // Step 2: Build chat messages
    const chatMessages = buildChatMessages(params.scenario, messages);

    // Step 3: Start stream
    const streamResult = await env.generateChatCompletionStream(chatMessages, signal)();
    if (isLeft(streamResult)) {
      yield { type: 'error', error: getErrorMessage(streamResult.left) };
      return;
    }
    const { stream } = streamResult.right;

    // Step 4: Stream deltas and accumulate content
    let fullContent = '';
    try {
      for await (const delta of stream) {
        if (signal?.aborted) return;
        fullContent += delta;
        yield { type: 'delta', content: delta };
      }
    } catch (error) {
      // Ignore abort errors — client disconnected, nothing to report
      if (signal?.aborted) return;
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Stream interrupted',
      };
      return;
    }

    // Step 5: Skip saving if aborted
    if (signal?.aborted) return;

    // Step 6: Validate content is not empty
    if (!fullContent.trim()) {
      yield { type: 'error', error: 'AI returned empty response' };
      return;
    }

    // Step 7: Create and save complete message to DB
    let message;
    try {
      message = messageCreate({
        conversationId: params.conversationId,
        role: 'assistant',
        content: fullContent,
      });
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to create message',
      };
      return;
    }

    const saveResult = await env.saveMessage(message)();
    if (isLeft(saveResult)) {
      yield { type: 'error', error: getErrorMessage(saveResult.left) };
      return;
    }

    // Step 8: Yield done event with message ID
    yield {
      type: 'done',
      messageId: message.id,
      fullContent,
    };
  })();
};
