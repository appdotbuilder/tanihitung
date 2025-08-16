import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { calculatorsTable, usersTable } from '../db/schema';
import { seedCalculators, seedTestUser, runSeeds } from '../handlers/seed';
import { eq } from 'drizzle-orm';

describe('seed handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('seedCalculators', () => {
    it('should create all 5 initial calculators', async () => {
      await seedCalculators();

      const calculators = await db.select()
        .from(calculatorsTable)
        .execute();

      expect(calculators).toHaveLength(5);

      // Check that all expected calculators are created
      const expectedSlugs = [
        'fertilizer-requirement',
        'chicken-feed-daily',
        'livestock-medicine-dosage',
        'harvest-estimation',
        'planting-cost'
      ];

      const actualSlugs = calculators.map(calc => calc.slug);
      expectedSlugs.forEach(slug => {
        expect(actualSlugs).toContain(slug);
      });
    });

    it('should create fertilizer calculator with correct data', async () => {
      await seedCalculators();

      const calculator = await db.select()
        .from(calculatorsTable)
        .where(eq(calculatorsTable.slug, 'fertilizer-requirement'))
        .execute();

      expect(calculator).toHaveLength(1);
      expect(calculator[0].name).toEqual('Fertilizer Requirement');
      expect(calculator[0].description).toEqual('Calculate how much fertilizer you need for your farm area');
      expect(calculator[0].category).toEqual('farming');
      expect(calculator[0].unit_label).toEqual('kg');
      expect(calculator[0].formula_key).toEqual('fertilizer-requirement');
      expect(calculator[0].created_at).toBeInstanceOf(Date);
      expect(calculator[0].updated_at).toBeInstanceOf(Date);
    });

    it('should create chicken feed calculator with correct data', async () => {
      await seedCalculators();

      const calculator = await db.select()
        .from(calculatorsTable)
        .where(eq(calculatorsTable.slug, 'chicken-feed-daily'))
        .execute();

      expect(calculator).toHaveLength(1);
      expect(calculator[0].name).toEqual('Chicken Daily Feed Requirement');
      expect(calculator[0].category).toEqual('livestock');
      expect(calculator[0].unit_label).toEqual('kg/day');
      expect(calculator[0].formula_key).toEqual('chicken-feed-daily');
    });

    it('should not duplicate calculators on multiple runs', async () => {
      // Run seeding twice
      await seedCalculators();
      await seedCalculators();

      const calculators = await db.select()
        .from(calculatorsTable)
        .execute();

      // Should still only have 5 calculators
      expect(calculators).toHaveLength(5);
    });

    it('should create calculators with proper categories', async () => {
      await seedCalculators();

      const calculators = await db.select()
        .from(calculatorsTable)
        .execute();

      const farmingCalculators = calculators.filter(calc => calc.category === 'farming');
      const livestockCalculators = calculators.filter(calc => calc.category === 'livestock');

      expect(farmingCalculators).toHaveLength(3); // fertilizer, harvest, planting
      expect(livestockCalculators).toHaveLength(2); // chicken feed, medicine
    });
  });

  describe('seedTestUser', () => {
    it('should create test user', async () => {
      await seedTestUser();

      const users = await db.select()
        .from(usersTable)
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toEqual('Test User');
      expect(users[0].email).toEqual('test@example.com');
      expect(users[0].password).toEqual('password123');
      expect(users[0].created_at).toBeInstanceOf(Date);
      expect(users[0].updated_at).toBeInstanceOf(Date);
    });

    it('should not duplicate test user on multiple runs', async () => {
      // Run seeding twice
      await seedTestUser();
      await seedTestUser();

      const users = await db.select()
        .from(usersTable)
        .execute();

      // Should still only have 1 user
      expect(users).toHaveLength(1);
    });

    it('should create user with correct email format', async () => {
      await seedTestUser();

      const user = await db.select()
        .from(usersTable)
        .where(eq(usersTable.email, 'test@example.com'))
        .execute();

      expect(user).toHaveLength(1);
      expect(user[0].email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  describe('runSeeds', () => {
    it('should create both test user and calculators', async () => {
      await runSeeds();

      const users = await db.select()
        .from(usersTable)
        .execute();

      const calculators = await db.select()
        .from(calculatorsTable)
        .execute();

      expect(users).toHaveLength(1);
      expect(calculators).toHaveLength(5);
    });

    it('should complete successfully without errors', async () => {
      // This should not throw any errors
      await expect(runSeeds()).resolves.toBeUndefined();
    });

    it('should handle multiple runs gracefully', async () => {
      // Run seeding multiple times
      await runSeeds();
      await runSeeds();
      await runSeeds();

      const users = await db.select()
        .from(usersTable)
        .execute();

      const calculators = await db.select()
        .from(calculatorsTable)
        .execute();

      // Should still have correct counts
      expect(users).toHaveLength(1);
      expect(calculators).toHaveLength(5);
    });
  });
});