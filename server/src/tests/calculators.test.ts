import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { calculatorsTable } from '../db/schema';
import { type CreateCalculatorInput } from '../schema';
import { 
  getCalculators, 
  getCalculatorBySlug, 
  getCalculatorsByCategory, 
  createCalculator, 
  searchCalculators 
} from '../handlers/calculators';
import { eq } from 'drizzle-orm';

// Test input data
const testFarmingCalculator: CreateCalculatorInput = {
  name: 'Test Fertilizer Calculator',
  slug: 'test-fertilizer',
  description: 'A calculator for testing fertilizer requirements',
  category: 'farming',
  unit_label: 'kg',
  formula_key: 'test-fertilizer-formula'
};

const testLivestockCalculator: CreateCalculatorInput = {
  name: 'Test Feed Calculator',
  slug: 'test-feed',
  description: 'A calculator for testing animal feed requirements',
  category: 'livestock',
  unit_label: 'kg/day',
  formula_key: 'test-feed-formula'
};

describe('calculators handlers', () => {
  beforeEach(async () => {
    await resetDB();
    await createDB();
  });
  afterEach(resetDB);

  describe('createCalculator', () => {
    it('should create a calculator', async () => {
      const result = await createCalculator(testFarmingCalculator);

      // Verify returned data
      expect(result.name).toEqual('Test Fertilizer Calculator');
      expect(result.slug).toEqual('test-fertilizer');
      expect(result.description).toEqual(testFarmingCalculator.description);
      expect(result.category).toEqual('farming');
      expect(result.unit_label).toEqual('kg');
      expect(result.formula_key).toEqual('test-fertilizer-formula');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save calculator to database', async () => {
      const result = await createCalculator(testFarmingCalculator);

      // Verify in database
      const calculators = await db.select()
        .from(calculatorsTable)
        .where(eq(calculatorsTable.id, result.id))
        .execute();

      expect(calculators).toHaveLength(1);
      expect(calculators[0].name).toEqual('Test Fertilizer Calculator');
      expect(calculators[0].slug).toEqual('test-fertilizer');
      expect(calculators[0].category).toEqual('farming');
    });

    it('should throw error for duplicate slug', async () => {
      await createCalculator(testFarmingCalculator);
      
      // Try to create another calculator with same slug
      await expect(createCalculator(testFarmingCalculator))
        .rejects.toThrow(/unique/i);
    });
  });

  describe('getCalculators', () => {
    it('should return empty array when no calculators exist', async () => {
      const result = await getCalculators();
      expect(result).toEqual([]);
    });

    it('should return all calculators ordered by category and name', async () => {
      // Create test calculators
      const calc1 = await createCalculator(testLivestockCalculator);
      const calc2 = await createCalculator(testFarmingCalculator);
      const calc3 = await createCalculator({
        ...testFarmingCalculator,
        name: 'Another Farming Calculator',
        slug: 'another-farming'
      });

      const result = await getCalculators();

      expect(result).toHaveLength(3);
      
      // Should be ordered by category (farming first), then name
      expect(result[0].name).toEqual('Another Farming Calculator');
      expect(result[0].category).toEqual('farming');
      expect(result[1].name).toEqual('Test Fertilizer Calculator');
      expect(result[1].category).toEqual('farming');
      expect(result[2].name).toEqual('Test Feed Calculator');
      expect(result[2].category).toEqual('livestock');
    });

    it('should return calculators with all required fields', async () => {
      await createCalculator(testFarmingCalculator);

      const result = await getCalculators();
      const calculator = result[0];

      expect(calculator.id).toBeDefined();
      expect(calculator.name).toBeDefined();
      expect(calculator.slug).toBeDefined();
      expect(calculator.description).toBeDefined();
      expect(calculator.category).toBeDefined();
      expect(calculator.unit_label).toBeDefined();
      expect(calculator.formula_key).toBeDefined();
      expect(calculator.created_at).toBeInstanceOf(Date);
      expect(calculator.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getCalculatorBySlug', () => {
    it('should return null for non-existent slug', async () => {
      const result = await getCalculatorBySlug('non-existent');
      expect(result).toBeNull();
    });

    it('should return calculator by slug', async () => {
      const created = await createCalculator(testFarmingCalculator);

      const result = await getCalculatorBySlug('test-fertilizer');

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Test Fertilizer Calculator');
      expect(result!.slug).toEqual('test-fertilizer');
    });

    it('should return exact match only', async () => {
      await createCalculator(testFarmingCalculator);
      await createCalculator({
        ...testLivestockCalculator,
        slug: 'test-fertilizer-2'
      });

      const result = await getCalculatorBySlug('test-fertilizer');

      expect(result).not.toBeNull();
      expect(result!.slug).toEqual('test-fertilizer');
      expect(result!.name).toEqual('Test Fertilizer Calculator');
    });
  });

  describe('getCalculatorsByCategory', () => {
    beforeEach(async () => {
      // Create calculators in both categories
      await createCalculator(testFarmingCalculator);
      await createCalculator(testLivestockCalculator);
      await createCalculator({
        ...testFarmingCalculator,
        name: 'Another Farming Calc',
        slug: 'another-farming'
      });
    });

    it('should return all calculators when no category specified', async () => {
      const result = await getCalculatorsByCategory();
      expect(result).toHaveLength(3);
    });

    it('should filter by farming category', async () => {
      const result = await getCalculatorsByCategory('farming');
      
      expect(result).toHaveLength(2);
      result.forEach(calc => {
        expect(calc.category).toEqual('farming');
      });
    });

    it('should filter by livestock category', async () => {
      const result = await getCalculatorsByCategory('livestock');
      
      expect(result).toHaveLength(1);
      expect(result[0].category).toEqual('livestock');
      expect(result[0].name).toEqual('Test Feed Calculator');
    });

    it('should order results by name within category', async () => {
      const result = await getCalculatorsByCategory('farming');
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Another Farming Calc');
      expect(result[1].name).toEqual('Test Fertilizer Calculator');
    });

    it('should return empty array for category with no calculators', async () => {
      // Create only livestock calculators, then search for farming
      await resetDB();
      await createDB();
      
      await createCalculator(testLivestockCalculator);

      const result = await getCalculatorsByCategory('farming');
      expect(result).toEqual([]);
    });
  });

  describe('searchCalculators', () => {
    beforeEach(async () => {
      // Create test calculators with diverse content
      await createCalculator({
        name: 'Fertilizer Calculator',
        slug: 'fertilizer-calc',
        description: 'Calculate fertilizer requirements for crops',
        category: 'farming',
        unit_label: 'kg',
        formula_key: 'fertilizer-formula'
      });

      await createCalculator({
        name: 'Feed Calculator',
        slug: 'feed-calc',
        description: 'Calculate daily feed requirements for livestock',
        category: 'livestock',
        unit_label: 'kg/day',
        formula_key: 'feed-formula'
      });

      await createCalculator({
        name: 'Medicine Dosage',
        slug: 'medicine-calc',
        description: 'Calculate proper medicine dosage for animals',
        category: 'livestock',
        unit_label: 'ml',
        formula_key: 'medicine-formula'
      });
    });

    it('should return empty array for no matches', async () => {
      const result = await searchCalculators('nonexistent');
      expect(result).toEqual([]);
    });

    it('should search by name (case insensitive)', async () => {
      const result = await searchCalculators('fertilizer');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('Fertilizer Calculator');
    });

    it('should search by name with different case', async () => {
      const result = await searchCalculators('FEED');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('Feed Calculator');
    });

    it('should search by description', async () => {
      const result = await searchCalculators('medicine dosage');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('Medicine Dosage');
    });

    it('should search by category', async () => {
      const result = await searchCalculators('livestock');
      
      expect(result).toHaveLength(2);
      result.forEach(calc => {
        expect(calc.category).toEqual('livestock');
      });
    });

    it('should search partial matches', async () => {
      const result = await searchCalculators('calc');
      
      expect(result).toHaveLength(3); // All calculators have "calc" in name or description
    });

    it('should return results ordered by category and name', async () => {
      const result = await searchCalculators('calc');
      
      expect(result).toHaveLength(3);
      // Should be ordered: farming first, then livestock, both ordered by name
      expect(result[0].category).toEqual('farming');
      expect(result[1].category).toEqual('livestock');
      expect(result[2].category).toEqual('livestock');
      
      // Within livestock category, should be ordered by name
      expect(result[1].name).toEqual('Feed Calculator');
      expect(result[2].name).toEqual('Medicine Dosage');
    });

    it('should handle empty search query', async () => {
      const result = await searchCalculators('');
      expect(result).toHaveLength(3); // Should return all calculators
    });

    it('should handle whitespace in search query', async () => {
      const result = await searchCalculators('  feed  ');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('Feed Calculator');
    });
  });
});