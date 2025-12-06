import { trpc } from './trpc';

describe('trpc hook', () => {
  it('should export trpc client with required methods', () => {
    expect(trpc).toBeDefined();
    expect(trpc.useUtils).toBeDefined();
    expect(trpc.Provider).toBeDefined();
    expect(trpc.createClient).toBeDefined();
  });
});
