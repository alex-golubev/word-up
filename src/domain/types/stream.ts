import type { MessageId } from '~/domain/types/common';

export type StreamDelta = {
  readonly type: 'delta';
  readonly content: string;
};

export type StreamDone = {
  readonly type: 'done';
  readonly messageId: MessageId;
  readonly fullContent: string;
};

export type StreamError = {
  readonly type: 'error';
  readonly error: string;
};

export type StreamEvent = StreamDelta | StreamDone | StreamError;
