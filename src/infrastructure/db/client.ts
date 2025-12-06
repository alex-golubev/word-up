import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from '~/infrastructure/db/schemas';

export const createDBClient = () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not defined');

  const sql = neon(process.env.DATABASE_URL);

  return drizzle(sql, { schema });
};

export type DBClient = ReturnType<typeof createDBClient>;
