import { 
    type CalculationInput,
    type CalculationResult,
    type FertilizerCalculationInput,
    type ChickenFeedCalculationInput,
    type LivestockMedicineCalculationInput,
    type HarvestEstimationCalculationInput,
    type PlantingCostCalculationInput,
    fertilizerCalculationInputSchema,
    chickenFeedCalculationInputSchema,
    livestockMedicineCalculationInputSchema,
    harvestEstimationCalculationInputSchema,
    plantingCostCalculationInputSchema
} from '../schema';

export async function calculate(formulaKey: string, inputs: CalculationInput): Promise<CalculationResult> {
    try {
        switch (formulaKey) {
            case 'fertilizer-requirement':
                return calculateFertilizerRequirement(inputs as FertilizerCalculationInput);
            case 'chicken-feed-daily':
                return calculateChickenFeedDaily(inputs as ChickenFeedCalculationInput);
            case 'livestock-medicine-dosage':
                return calculateLivestockMedicineDosage(inputs as LivestockMedicineCalculationInput);
            case 'harvest-estimation':
                return calculateHarvestEstimation(inputs as HarvestEstimationCalculationInput);
            case 'planting-cost':
                return calculatePlantingCost(inputs as PlantingCostCalculationInput);
            default:
                throw new Error(`Unknown formula key: ${formulaKey}`);
        }
    } catch (error) {
        console.error('Calculation failed:', error);
        throw error;
    }
}

export async function calculateFertilizerRequirement(inputs: FertilizerCalculationInput): Promise<CalculationResult> {
    try {
        // Formula: kg_needed = area_ha * dose_kg_per_ha
        const validatedInputs = fertilizerCalculationInputSchema.parse(inputs);
        const result_value = validatedInputs.area_ha * validatedInputs.dose_kg_per_ha;
        
        return {
            result_value,
            unit_label: "kg"
        };
    } catch (error) {
        console.error('Fertilizer requirement calculation failed:', error);
        throw error;
    }
}

export async function calculateChickenFeedDaily(inputs: ChickenFeedCalculationInput): Promise<CalculationResult> {
    try {
        // Formula: kg_per_day = chicken_count * feed_kg_per_chicken_per_day
        const validatedInputs = chickenFeedCalculationInputSchema.parse(inputs);
        const result_value = validatedInputs.chicken_count * validatedInputs.feed_kg_per_chicken_per_day;
        
        return {
            result_value,
            unit_label: "kg/day"
        };
    } catch (error) {
        console.error('Chicken feed daily calculation failed:', error);
        throw error;
    }
}

export async function calculateLivestockMedicineDosage(inputs: LivestockMedicineCalculationInput): Promise<CalculationResult> {
    try {
        // Formula: mg_total = weight_kg * dose_mg_per_kg
        // Optional: volume_ml = mg_total / concentration_mg_per_ml
        const validatedInputs = livestockMedicineCalculationInputSchema.parse(inputs);
        const mg_total = validatedInputs.weight_kg * validatedInputs.dose_mg_per_kg;
        
        const result: CalculationResult = {
            result_value: mg_total,
            unit_label: "mg"
        };
        
        // Calculate volume if concentration is provided
        if (validatedInputs.concentration_mg_per_ml) {
            const volume_ml = mg_total / validatedInputs.concentration_mg_per_ml;
            result.additional_info = { volume_ml };
        }
        
        return result;
    } catch (error) {
        console.error('Livestock medicine dosage calculation failed:', error);
        throw error;
    }
}

export async function calculateHarvestEstimation(inputs: HarvestEstimationCalculationInput): Promise<CalculationResult> {
    try {
        // Formula: ton_total = area_ha * yield_ton_per_ha
        const validatedInputs = harvestEstimationCalculationInputSchema.parse(inputs);
        const result_value = validatedInputs.area_ha * validatedInputs.yield_ton_per_ha;
        
        return {
            result_value,
            unit_label: "ton"
        };
    } catch (error) {
        console.error('Harvest estimation calculation failed:', error);
        throw error;
    }
}

export async function calculatePlantingCost(inputs: PlantingCostCalculationInput): Promise<CalculationResult> {
    try {
        // Formula: total_cost = area_ha * cost_rp_per_ha
        const validatedInputs = plantingCostCalculationInputSchema.parse(inputs);
        const result_value = validatedInputs.area_ha * validatedInputs.cost_rp_per_ha;
        
        return {
            result_value,
            unit_label: "Rp"
        };
    } catch (error) {
        console.error('Planting cost calculation failed:', error);
        throw error;
    }
}

export async function validateCalculationInputs(formulaKey: string, inputs: CalculationInput): Promise<boolean> {
    try {
        switch (formulaKey) {
            case 'fertilizer-requirement':
                fertilizerCalculationInputSchema.parse(inputs);
                break;
            case 'chicken-feed-daily':
                chickenFeedCalculationInputSchema.parse(inputs);
                break;
            case 'livestock-medicine-dosage':
                livestockMedicineCalculationInputSchema.parse(inputs);
                break;
            case 'harvest-estimation':
                harvestEstimationCalculationInputSchema.parse(inputs);
                break;
            case 'planting-cost':
                plantingCostCalculationInputSchema.parse(inputs);
                break;
            default:
                throw new Error(`Unknown formula key: ${formulaKey}`);
        }
        return true;
    } catch (error) {
        console.error('Calculation input validation failed:', error);
        throw error;
    }
}