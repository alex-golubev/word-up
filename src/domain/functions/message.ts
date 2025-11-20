import { randomUUID } from 'node:crypto';
import { pipe } from 'fp-ts/function';
import * as Arr from 'fp-ts/Array';
import type { ConversationId, Message, MessageRole } from '~/domain/types';
import { makeMessageId } from '~/domain/types';

/**
 * Creates a new message object for a conversation.
 *
 * @param {ConversationId} conversationId - The unique identifier of the conversation where the message belongs.
 * @param {MessageRole} role - The role of the message sender, such as user or system.
 * @param {string} content - The textual content of the message.
 * @returns {Message} A message object containing all necessary properties, including a unique ID and timestamp.
 */
export const messageCreate = (
  conversationId: ConversationId,
  role: MessageRole,
  content: string
): Message => ({
  id: makeMessageId(randomUUID()),
  conversationId,
  role,
  content,
  timestamp: new Date(),
});

/**
 * A higher-order function that takes a number `n` and returns a function.
 * The returned function takes an array of messages and retrieves the last
 * `n` messages from the array.
 *
 * @param {number} n - The number of messages to retrieve from the end of the array.
 * @returns {(messages: Message[]) => readonly Message[]} A function that, when given
 * an array of messages, returns a new array containing the last `n` messages.
 */
export const messageTakeLast =
  (n: number): ((messages: Message[]) => readonly Message[]) =>
  (messages: Message[]): readonly Message[] =>
    pipe(messages, Arr.takeRight(n));

/**
 * Converts an array of message objects into a formatted string suitable for AI processing.
 *
 * @param {readonly Message[]} messages - An array of message objects, where each object contains a role and a content property.
 * @returns {string} A single formatted string where each message is represented as "role: content",
 *                   with each message separated by a newline character.
 */
export const messageFormatForAI = (messages: readonly Message[]): string =>
  messages.map((m) => `${m.role}: ${m.content}`).join('\n');

/**
 * Filters an array of messages by a specified role.
 *
 * @param {MessageRole} role - The role used as the filter criteria.
 * @returns {(messages: readonly Message[]) => readonly Message[]} A function that takes an array of messages and returns a new array containing only the messages with the specified role.
 */
export const messageFilterByRole =
  (role: MessageRole): ((messages: readonly Message[]) => readonly Message[]) =>
  (messages: readonly Message[]): readonly Message[] =>
    messages.filter((m) => m.role === role);

/**
 * A higher-order function that appends a message object to an existing array of messages.
 *
 * @function
 * @param {Message} message - The message object to be appended.
 * @returns {function} A function that takes an array of messages and returns
 * a new array with the provided message added to the end.
 */
export const messageAppend =
  (message: Message): ((messages: readonly Message[]) => readonly Message[]) =>
  (messages: readonly Message[]): readonly Message[] => [...messages, message];
