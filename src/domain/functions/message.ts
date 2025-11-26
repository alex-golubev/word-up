import { randomUUID } from 'node:crypto';
import { pipe } from 'fp-ts/function';
import * as Arr from 'fp-ts/Array';
import type { ConversationId, Message, MessageRole } from '~/domain/types';
import { makeMessageId } from '~/domain/types';

const MESSAGE_CONTENT_MAX_LENGTH = 10000;

const validateMessageContent = (content: string): void => {
  if (content.trim().length === 0) {
    throw new Error('Message content cannot be empty');
  }
  if (content.length > MESSAGE_CONTENT_MAX_LENGTH) {
    throw new Error(
      `Message content exceeds maximum length of ${MESSAGE_CONTENT_MAX_LENGTH} characters`
    );
  }
};

/**
 * Creates a new message object with a unique identifier, associated conversation ID, role,
 * message content, and creation timestamp.
 *
 * @param {ConversationId} conversationId - The unique identifier for the conversation to which the message belongs.
 * @param {MessageRole} role - The role associated with the message (e.g., user, system, etc.).
 * @param {string} content - The content of the message. Must pass validation criteria.
 * @returns {Message} A newly created message object containing an ID, conversation ID, role, content, and a timestamp.
 */
export const messageCreate = (
  conversationId: ConversationId,
  role: MessageRole,
  content: string
): Message => {
  validateMessageContent(content);
  return {
    id: makeMessageId(randomUUID()),
    conversationId,
    role,
    content,
    createdAt: new Date(),
  };
};

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
