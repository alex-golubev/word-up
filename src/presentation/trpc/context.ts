import { createDBClient } from '~/infrastructure/db/client';

export const createContext = () => {
  const db = createDBClient();
  return { db };
};

export type Context = ReturnType<typeof createContext>;
