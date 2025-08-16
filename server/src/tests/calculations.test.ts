import { describe, expect, it } from 'bun:test';
import {
  calculate,
  calculateFertilizerRequirement,
  calculateChickenFeedDaily,
  calculateLivestockMedicineDosage,
  calculateHarvestEstimation,
  calculatePlantingCost,
  validateCalculationInputs
} from '../handlers/calculations';
import {
  type FertilizerCalculationInput,
  type ChickenFeedCalculationInput,
  type LivestockMedicineCalculationInput,
  type HarvestEstimationCalculationInput,
  type PlantingCostCalculationInput,
  type CalculationInput
} from '../schema';

describe('calculations', () => {
  describe('calculateFertilizerRequirement', () => {
    it('should calculate fertilizer requirement correctly', async () => {
      const input: FertilizerCalculationInput = {
        area_ha: 5.0,
        dose_kg_per_ha: 150
      };

      const result = await calculateFertilizerRequirement(input);

      expect(result.result_value).toEqual(750); // 5 * 150
      expect(result.unit_label).toEqual('kg');
      expect(result.additional_info).toBeUndefined();
    });

    it('should use default dose when not provided', async () => {
      const input: FertilizerCalculationInput = {
        area_ha: 2.0,
        dose_kg_per_ha: 100 // default value
      };

      const result = await calculateFertilizerRequirement(input);

      expect(result.result_value).toEqual(200); // 2 * 100
      expect(result.unit_label).toEqual('kg');
    });

    it('should handle decimal values correctly', async () => {
      const input: FertilizerCalculationInput = {
        area_ha: 1.5,
        dose_kg_per_ha: 125.5
      };

      const result = await calculateFertilizerRequirement(input);

      expect(result.result_value).toEqual(188.25); // 1.5 * 125.5
      expect(result.unit_label).toEqual('kg');
    });

    it('should reject negative area', async () => {
      const input = {
        area_ha: -1.0,
        dose_kg_per_ha: 100
      };

      await expect(calculateFertilizerRequirement(input as FertilizerCalculationInput))
        .rejects.toThrow(/area must be greater than 0/i);
    });

    it('should reject zero area', async () => {
      const input = {
        area_ha: 0,
        dose_kg_per_ha: 100
      };

      await expect(calculateFertilizerRequirement(input as FertilizerCalculationInput))
        .rejects.toThrow(/area must be greater than 0/i);
    });

    it('should reject negative dose', async () => {
      const input = {
        area_ha: 5.0,
        dose_kg_per_ha: -50
      };

      await expect(calculateFertilizerRequirement(input as FertilizerCalculationInput))
        .rejects.toThrow(/dose must be greater than 0/i);
    });
  });

  describe('calculateChickenFeedDaily', () => {
    it('should calculate daily chicken feed correctly', async () => {
      const input: ChickenFeedCalculationInput = {
        chicken_count: 100,
        feed_kg_per_chicken_per_day: 0.15
      };

      const result = await calculateChickenFeedDaily(input);

      expect(result.result_value).toEqual(15); // 100 * 0.15
      expect(result.unit_label).toEqual('kg/day');
    });

    it('should use default feed amount when not provided', async () => {
      const input: ChickenFeedCalculationInput = {
        chicken_count: 50,
        feed_kg_per_chicken_per_day: 0.12 // default value
      };

      const result = await calculateChickenFeedDaily(input);

      expect(result.result_value).toEqual(6); // 50 * 0.12
      expect(result.unit_label).toEqual('kg/day');
    });

    it('should handle large chicken counts', async () => {
      const input: ChickenFeedCalculationInput = {
        chicken_count: 1000,
        feed_kg_per_chicken_per_day: 0.1
      };

      const result = await calculateChickenFeedDaily(input);

      expect(result.result_value).toEqual(100); // 1000 * 0.1
      expect(result.unit_label).toEqual('kg/day');
    });

    it('should reject non-integer chicken count', async () => {
      const input = {
        chicken_count: 50.5,
        feed_kg_per_chicken_per_day: 0.12
      };

      await expect(calculateChickenFeedDaily(input as ChickenFeedCalculationInput))
        .rejects.toThrow();
    });

    it('should reject negative chicken count', async () => {
      const input = {
        chicken_count: -10,
        feed_kg_per_chicken_per_day: 0.12
      };

      await expect(calculateChickenFeedDaily(input as ChickenFeedCalculationInput))
        .rejects.toThrow(/chicken count must be greater than 0/i);
    });

    it('should reject zero feed amount', async () => {
      const input = {
        chicken_count: 100,
        feed_kg_per_chicken_per_day: 0
      };

      await expect(calculateChickenFeedDaily(input as ChickenFeedCalculationInput))
        .rejects.toThrow(/feed amount must be greater than 0/i);
    });
  });

  describe('calculateLivestockMedicineDosage', () => {
    it('should calculate medicine dosage without concentration', async () => {
      const input: LivestockMedicineCalculationInput = {
        weight_kg: 500,
        dose_mg_per_kg: 10
      };

      const result = await calculateLivestockMedicineDosage(input);

      expect(result.result_value).toEqual(5000); // 500 * 10
      expect(result.unit_label).toEqual('mg');
      expect(result.additional_info).toBeUndefined();
    });

    it('should calculate medicine dosage with volume when concentration provided', async () => {
      const input: LivestockMedicineCalculationInput = {
        weight_kg: 250,
        dose_mg_per_kg: 5,
        concentration_mg_per_ml: 100
      };

      const result = await calculateLivestockMedicineDosage(input);

      expect(result.result_value).toEqual(1250); // 250 * 5
      expect(result.unit_label).toEqual('mg');
      expect(result.additional_info).toBeDefined();
      expect(result.additional_info?.['volume_ml']).toEqual(12.5); // 1250 / 100
    });

    it('should handle decimal weights correctly', async () => {
      const input: LivestockMedicineCalculationInput = {
        weight_kg: 75.5,
        dose_mg_per_kg: 8,
        concentration_mg_per_ml: 50
      };

      const result = await calculateLivestockMedicineDosage(input);

      expect(result.result_value).toEqual(604); // 75.5 * 8
      expect(result.unit_label).toEqual('mg');
      expect(result.additional_info?.['volume_ml']).toEqual(12.08); // 604 / 50
    });

    it('should reject negative weight', async () => {
      const input = {
        weight_kg: -100,
        dose_mg_per_kg: 5
      };

      await expect(calculateLivestockMedicineDosage(input as LivestockMedicineCalculationInput))
        .rejects.toThrow(/weight must be greater than 0/i);
    });

    it('should reject zero dose', async () => {
      const input = {
        weight_kg: 200,
        dose_mg_per_kg: 0
      };

      await expect(calculateLivestockMedicineDosage(input as LivestockMedicineCalculationInput))
        .rejects.toThrow(/dose must be greater than 0/i);
    });

    it('should reject negative concentration', async () => {
      const input = {
        weight_kg: 200,
        dose_mg_per_kg: 5,
        concentration_mg_per_ml: -10
      };

      await expect(calculateLivestockMedicineDosage(input as LivestockMedicineCalculationInput))
        .rejects.toThrow(/concentration must be greater than 0/i);
    });
  });

  describe('calculateHarvestEstimation', () => {
    it('should calculate harvest estimation correctly', async () => {
      const input: HarvestEstimationCalculationInput = {
        area_ha: 10.0,
        yield_ton_per_ha: 7.5
      };

      const result = await calculateHarvestEstimation(input);

      expect(result.result_value).toEqual(75); // 10 * 7.5
      expect(result.unit_label).toEqual('ton');
    });

    it('should use default yield when not provided', async () => {
      const input: HarvestEstimationCalculationInput = {
        area_ha: 4.0,
        yield_ton_per_ha: 5 // default value
      };

      const result = await calculateHarvestEstimation(input);

      expect(result.result_value).toEqual(20); // 4 * 5
      expect(result.unit_label).toEqual('ton');
    });

    it('should handle small areas correctly', async () => {
      const input: HarvestEstimationCalculationInput = {
        area_ha: 0.5,
        yield_ton_per_ha: 6
      };

      const result = await calculateHarvestEstimation(input);

      expect(result.result_value).toEqual(3); // 0.5 * 6
      expect(result.unit_label).toEqual('ton');
    });

    it('should reject negative area', async () => {
      const input = {
        area_ha: -2.0,
        yield_ton_per_ha: 5
      };

      await expect(calculateHarvestEstimation(input as HarvestEstimationCalculationInput))
        .rejects.toThrow(/area must be greater than 0/i);
    });

    it('should reject zero yield', async () => {
      const input = {
        area_ha: 5.0,
        yield_ton_per_ha: 0
      };

      await expect(calculateHarvestEstimation(input as HarvestEstimationCalculationInput))
        .rejects.toThrow(/yield must be greater than 0/i);
    });
  });

  describe('calculatePlantingCost', () => {
    it('should calculate planting cost correctly', async () => {
      const input: PlantingCostCalculationInput = {
        area_ha: 3.0,
        cost_rp_per_ha: 1500000
      };

      const result = await calculatePlantingCost(input);

      expect(result.result_value).toEqual(4500000); // 3 * 1500000
      expect(result.unit_label).toEqual('Rp');
    });

    it('should use default cost when not provided', async () => {
      const input: PlantingCostCalculationInput = {
        area_ha: 2.0,
        cost_rp_per_ha: 1000000 // default value
      };

      const result = await calculatePlantingCost(input);

      expect(result.result_value).toEqual(2000000); // 2 * 1000000
      expect(result.unit_label).toEqual('Rp');
    });

    it('should handle large areas correctly', async () => {
      const input: PlantingCostCalculationInput = {
        area_ha: 100.0,
        cost_rp_per_ha: 2000000
      };

      const result = await calculatePlantingCost(input);

      expect(result.result_value).toEqual(200000000); // 100 * 2000000
      expect(result.unit_label).toEqual('Rp');
    });

    it('should reject negative area', async () => {
      const input = {
        area_ha: -1.0,
        cost_rp_per_ha: 1000000
      };

      await expect(calculatePlantingCost(input as PlantingCostCalculationInput))
        .rejects.toThrow(/area must be greater than 0/i);
    });

    it('should reject zero cost', async () => {
      const input = {
        area_ha: 5.0,
        cost_rp_per_ha: 0
      };

      await expect(calculatePlantingCost(input as PlantingCostCalculationInput))
        .rejects.toThrow(/cost must be greater than 0/i);
    });
  });

  describe('calculate (main function)', () => {
    it('should delegate to fertilizer calculation', async () => {
      const input: CalculationInput = {
        area_ha: 2.0,
        dose_kg_per_ha: 120
      };

      const result = await calculate('fertilizer-requirement', input);

      expect(result.result_value).toEqual(240);
      expect(result.unit_label).toEqual('kg');
    });

    it('should delegate to chicken feed calculation', async () => {
      const input: CalculationInput = {
        chicken_count: 80,
        feed_kg_per_chicken_per_day: 0.1
      };

      const result = await calculate('chicken-feed-daily', input);

      expect(result.result_value).toEqual(8);
      expect(result.unit_label).toEqual('kg/day');
    });

    it('should delegate to livestock medicine calculation', async () => {
      const input: CalculationInput = {
        weight_kg: 300,
        dose_mg_per_kg: 15,
        concentration_mg_per_ml: 150
      };

      const result = await calculate('livestock-medicine-dosage', input);

      expect(result.result_value).toEqual(4500);
      expect(result.unit_label).toEqual('mg');
      expect(result.additional_info?.['volume_ml']).toEqual(30);
    });

    it('should delegate to harvest estimation calculation', async () => {
      const input: CalculationInput = {
        area_ha: 8.0,
        yield_ton_per_ha: 6
      };

      const result = await calculate('harvest-estimation', input);

      expect(result.result_value).toEqual(48);
      expect(result.unit_label).toEqual('ton');
    });

    it('should delegate to planting cost calculation', async () => {
      const input: CalculationInput = {
        area_ha: 5.0,
        cost_rp_per_ha: 1200000
      };

      const result = await calculate('planting-cost', input);

      expect(result.result_value).toEqual(6000000);
      expect(result.unit_label).toEqual('Rp');
    });

    it('should throw error for unknown formula key', async () => {
      const input: CalculationInput = {
        some_field: 123
      };

      await expect(calculate('unknown-formula', input))
        .rejects.toThrow(/unknown formula key: unknown-formula/i);
    });
  });

  describe('validateCalculationInputs', () => {
    it('should validate fertilizer inputs successfully', async () => {
      const input: CalculationInput = {
        area_ha: 5.0,
        dose_kg_per_ha: 150
      };

      const result = await validateCalculationInputs('fertilizer-requirement', input);
      expect(result).toBe(true);
    });

    it('should validate chicken feed inputs successfully', async () => {
      const input: CalculationInput = {
        chicken_count: 100,
        feed_kg_per_chicken_per_day: 0.12
      };

      const result = await validateCalculationInputs('chicken-feed-daily', input);
      expect(result).toBe(true);
    });

    it('should validate livestock medicine inputs successfully', async () => {
      const input: CalculationInput = {
        weight_kg: 400,
        dose_mg_per_kg: 8,
        concentration_mg_per_ml: 100
      };

      const result = await validateCalculationInputs('livestock-medicine-dosage', input);
      expect(result).toBe(true);
    });

    it('should validate harvest estimation inputs successfully', async () => {
      const input: CalculationInput = {
        area_ha: 10.0,
        yield_ton_per_ha: 7
      };

      const result = await validateCalculationInputs('harvest-estimation', input);
      expect(result).toBe(true);
    });

    it('should validate planting cost inputs successfully', async () => {
      const input: CalculationInput = {
        area_ha: 3.0,
        cost_rp_per_ha: 1500000
      };

      const result = await validateCalculationInputs('planting-cost', input);
      expect(result).toBe(true);
    });

    it('should reject invalid inputs', async () => {
      const input: CalculationInput = {
        area_ha: -1.0, // Invalid negative value
        dose_kg_per_ha: 150
      };

      await expect(validateCalculationInputs('fertilizer-requirement', input))
        .rejects.toThrow(/area must be greater than 0/i);
    });

    it('should reject unknown formula key', async () => {
      const input: CalculationInput = {
        some_field: 123
      };

      await expect(validateCalculationInputs('unknown-formula', input))
        .rejects.toThrow(/unknown formula key: unknown-formula/i);
    });

    it('should reject missing required fields', async () => {
      const input: CalculationInput = {
        // Missing required chicken_count field
        feed_kg_per_chicken_per_day: 0.12
      };

      await expect(validateCalculationInputs('chicken-feed-daily', input))
        .rejects.toThrow();
    });
  });
});