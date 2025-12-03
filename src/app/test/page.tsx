'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { trpc } from '~/presentation/hooks/trpc';
import type { Conversation } from '~/domain/types';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

const TEST_SCENARIO = {
  id: 'coffee-shop',
  title: 'Ordering Coffee',
  description: 'You are at a coffee shop and want to order a drink.',
  role: 'You are a friendly barista at a cozy coffee shop.',
  userLevel: 'beginner' as const,
  targetLanguage: 'en' as const,
  startingMessage: 'Hello! Welcome to our coffee shop. What can I get for you today?',
  vocabulary: ['coffee', 'latte', 'cappuccino', 'espresso', 'milk', 'sugar'],
};

export default function TestPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createConversation = trpc.chat.createConversation.useMutation();
  const sendMessage = trpc.chat.sendMessage.useMutation();
  const generateResponseStream = trpc.chat.generateResponseStream.useMutation();
  const getConversation = trpc.chat.getConversation.useQuery(
    { conversationId: conversation?.id ?? ('' as never) },
    { enabled: !!conversation?.id }
  );

  const handleStart = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await createConversation.mutateAsync({
        userId: TEST_USER_ID,
        scenarioId: TEST_SCENARIO.id,
        targetLanguage: TEST_SCENARIO.targetLanguage,
        userLevel: TEST_SCENARIO.userLevel,
      });
      setConversation(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!conversation || !userMessage.trim()) return;

    const messageText = userMessage.trim();
    setError(null);
    setIsLoading(true);
    setStreamingContent('');
    setUserMessage('');
    setPendingUserMessage(messageText);

    try {
      await sendMessage.mutateAsync({
        conversationId: conversation.id,
        role: 'user',
        content: messageText,
      });

      const stream = await generateResponseStream.mutateAsync({
        conversationId: conversation.id,
        scenario: TEST_SCENARIO,
      });

      for await (const event of stream) {
        switch (event.type) {
          case 'delta':
            setStreamingContent((prev) => prev + event.content);
            break;
          case 'done':
            await getConversation.refetch();
            setPendingUserMessage(null);
            setStreamingContent('');
            break;
          case 'error':
            setError(event.error);
            break;
        }
      }
    } catch (e) {
      // tRPC async generator throws undefined on normal completion (known issue)
      // https://github.com/trpc/trpc/issues/5851
      const isStreamEndSignal = e === undefined;
      if (!isStreamEndSignal) {
        setError(e instanceof Error ? e.message : 'Failed to send message');
        setPendingUserMessage(null);
      }
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const messages = useMemo(() => getConversation.data?.messages ?? [], [getConversation.data?.messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingUserMessage, streamingContent]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {!conversation ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-3xl">
                ☕
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-800">{TEST_SCENARIO.title}</h1>
              <p className="text-gray-500">{TEST_SCENARIO.description}</p>
            </div>

            <div className="mb-6 rounded-xl bg-gray-50 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Your practice partner</p>
              <p className="text-sm text-gray-600">{TEST_SCENARIO.role}</p>
            </div>

            <div className="mb-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Vocabulary</p>
              <div className="flex flex-wrap gap-2">
                {TEST_SCENARIO.vocabulary.map((word) => (
                  <span key={word} className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-600">
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={isLoading}
              className="w-full rounded-xl bg-indigo-600 py-4 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : 'Start Practice'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <header className="border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-sm">
            <div className="mx-auto flex max-w-lg items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg">☕</div>
              <div>
                <h1 className="font-semibold text-gray-800">{TEST_SCENARIO.title}</h1>
                <p className="text-xs text-gray-500">
                  {TEST_SCENARIO.userLevel} • {TEST_SCENARIO.targetLanguage.toUpperCase()}
                </p>
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col overflow-y-auto p-4">
            <div className="mt-auto mx-auto max-w-lg w-full space-y-4">
              {messages.length === 0 && !pendingUserMessage && (
                <div className="py-12 text-center">
                  <p className="text-gray-400">Send a message to start practicing...</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'rounded-br-md bg-indigo-100 text-gray-800'
                        : 'rounded-bl-md bg-white text-gray-800 shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {pendingUserMessage && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-indigo-100 px-4 py-3 text-gray-800">
                    {pendingUserMessage}
                  </div>
                </div>
              )}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-gray-800 shadow-sm">
                    {streamingContent}
                    <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-indigo-500" />
                  </div>
                </div>
              )}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-300"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-300"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-300"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </main>

          <footer className="border-t border-gray-100 bg-white/80 p-4 backdrop-blur-sm">
            <div className="mx-auto flex max-w-lg gap-3">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors focus:border-indigo-300 focus:bg-white focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !userMessage.trim()}
                className="self-stretch rounded-xl bg-indigo-600 px-6 font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </footer>
        </>
      )}

      {error && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-lg bg-red-500 px-4 py-2 text-sm text-white shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
