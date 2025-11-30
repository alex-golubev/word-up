jest.mock('~/utils/transformer', () => ({
  transformer: {
    serialize: (v: unknown) => ({ json: v, meta: undefined }),
    deserialize: (v: { json: unknown }) => v.json,
  },
}));

import { appRouter, type AppRouter } from '~/presentation/trpc/routers';

describe('appRouter', () => {
  it('should export appRouter with chat namespace', () => {
    expect(appRouter).toBeDefined();
    const procedures = appRouter._def.procedures as Record<string, unknown>;
    expect(procedures['chat.createConversation']).toBeDefined();
    expect(procedures['chat.getConversation']).toBeDefined();
    expect(procedures['chat.sendMessage']).toBeDefined();
  });

  it('should export AppRouter type', () => {
    const typeCheck: AppRouter = appRouter;
    expect(typeCheck).toBe(appRouter);
  });
});
