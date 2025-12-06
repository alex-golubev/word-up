import { createDBClient } from './client';
import { scenarios, users } from './schemas';

const db = createDBClient();

async function seed() {
  console.log('Seeding database...');

  await db
    .insert(users)
    .values({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'test@example.com',
      nativeLanguage: 'ru',
    })
    .onConflictDoNothing();

  console.log('- Test user created');

  await db
    .insert(scenarios)
    .values({
      id: 'coffee-shop',
      title: 'Ordering Coffee',
      description: 'You are at a coffee shop and want to order a drink.',
      role: 'You are a friendly barista at a cozy coffee shop.',
      level: 'beginner',
      targetLanguage: 'en',
      startingMessage: 'Hello! Welcome to our coffee shop. What can I get for you today?',
      vocabulary: ['coffee', 'latte', 'cappuccino', 'espresso', 'milk', 'sugar'],
    })
    .onConflictDoNothing();

  console.log('- Coffee shop scenario created');

  console.log('Seed completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
