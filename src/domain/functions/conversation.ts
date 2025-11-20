import { randomUUID } from 'node:crypto';
import { makeConversationId } from '~/domain/types';
import type {
  Conversation,
  Language,
  Message,
  ScenarioId,
  UserId,
  UserLevel,
} from '~/domain/types';
import { messageAppend } from '~/domain/functions/message';

/**
 * Creates a new conversation object with the specified parameters.
 *
 * @param {UserId} userId - The unique identifier for the user associated with the conversation.
 * @param {ScenarioId} scenarioId - The identifier for the scenario related to the conversation.
 * @param {Language} targetLanguage - The target language for the conversation.
 * @param {UserLevel} userLevel - The proficiency level of the user in the target language.
 * @returns {Conversation} A new conversation object containing the provided details, an empty messages array, and timestamps for creation and last update.
 */
export const conversationCreate = (
  userId: UserId,
  scenarioId: ScenarioId,
  targetLanguage: Language,
  userLevel: UserLevel
): Conversation => ({
  id: makeConversationId(randomUUID()),
  userId,
  scenarioId,
  targetLanguage,
  userLevel,
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * A function that adds a given message to a conversation and updates the conversation's timestamp.
 *
 * @function
 * @param {Message} message - The message to be added to the conversation.
 * @returns {function(Conversation): Conversation} A function that takes a conversation object
 * and returns a new conversation object with the message appended and `updatedAt` updated to the current date.
 */
export const conversationAddMessage =
  (message: Message): ((conversation: Conversation) => Conversation) =>
  (conversation: Conversation): Conversation => ({
    ...conversation,
    messages: messageAppend(message)(conversation.messages),
    updatedAt: new Date(),
  });

/**
 * Retrieves the list of messages from the specified conversation.
 *
 * @param {Conversation} conversation - The conversation object containing messages.
 * @returns {readonly Message[]} An array of messages that are part of the given conversation, returned as a read-only collection.
 */
export const conversationMessages = (conversation: Conversation): readonly Message[] =>
  conversation.messages;

/**
 * Calculates the total number of messages in a given conversation.
 *
 * @param {Conversation} conversation - The conversation object containing messages.
 * @returns {number} The count of messages in the conversation.
 */
export const conversationMessagesCount = (conversation: Conversation): number =>
  conversation.messages.length;

/**
 * Retrieves the last message from a given conversation.
 *
 * @param {Conversation} conversation - The conversation object containing messages.
 * @returns {Message|undefined} The last message in the conversation, or undefined if the conversation has no messages.
 */
export const conversationLastMessage = (conversation: Conversation): Message | undefined =>
  conversation.messages[conversation.messages.length - 1];
