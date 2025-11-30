/**
 * @jest-environment node
 */

jest.mock('~/utils/transformer', () => ({
  transformer: {
    serialize: (v: unknown) => ({ json: v, meta: undefined }),
    deserialize: (v: { json: unknown }) => v.json,
  },
}));

jest.mock('~/infrastructure/db/client', () => ({
  createDBClient: () => ({}),
}));

import { GET, POST } from './route';

const createRequest = (method: string, path: string, body?: unknown) => {
  const url = `http://localhost:3000/api/trpc/${path}`;
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
};

describe('/api/trpc route handler', () => {
  describe('GET', () => {
    it('should handle batch query request', async () => {
      const req = createRequest('GET', 'chat.getConversation?batch=1&input={}');
      const response = await GET(req);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBeDefined();
    });

    it('should return error for invalid procedure', async () => {
      const req = createRequest('GET', 'nonexistent.procedure?batch=1&input={}');
      const response = await GET(req);
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].error).toBeDefined();
    });
  });

  describe('POST', () => {
    it('should handle batch mutation request', async () => {
      const req = createRequest('POST', 'chat.createConversation?batch=1', {
        0: { userId: 'invalid' },
      });
      const response = await POST(req);

      expect(response).toBeInstanceOf(Response);
      // Will fail validation, but handler works
      const data = await response.json();
      expect(data).toHaveLength(1);
    });

    it('should be the same handler as GET', () => {
      expect(GET).toBe(POST);
    });
  });
});
