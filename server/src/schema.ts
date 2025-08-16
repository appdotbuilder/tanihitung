import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  password: z.string(), // In real implementation, this would be hashed
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required")
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Calculator schemas
export const calculatorCategoryEnum = z.enum(["farming", "livestock"]);

export const calculatorSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: calculatorCategoryEnum,
  unit_label: z.string(),
  formula_key: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Calculator = z.infer<typeof calculatorSchema>;

export const createCalculatorInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  category: calculatorCategoryEnum,
  unit_label: z.string().min(1, "Unit label is required"),
  formula_key: z.string().min(1, "Formula key is required")
});

export type CreateCalculatorInput = z.infer<typeof createCalculatorInputSchema>;

// Result schemas
export const resultSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  calculator_id: z.number(),
  input_json: z.record(z.any()), // JSON object for flexible input storage
  result_value: z.number(),
  unit_label: z.string(),
  created_at: z.coerce.date()
});

export type Result = z.infer<typeof resultSchema>;

export const createResultInputSchema = z.object({
  user_id: z.number(),
  calculator_id: z.number(),
  input_json: z.record(z.any()),
  result_value: z.number(),
  unit_label: z.string()
});

export type CreateResultInput = z.infer<typeof createResultInputSchema>;

// Calculation input schemas for specific formulas
export const fertilizerCalculationInputSchema = z.object({
  area_ha: z.number().positive("Area must be greater than 0"),
  dose_kg_per_ha: z.number().positive("Dose must be greater than 0").default(100)
});

export type FertilizerCalculationInput = z.infer<typeof fertilizerCalculationInputSchema>;

export const chickenFeedCalculationInputSchema = z.object({
  chicken_count: z.number().int().positive("Chicken count must be greater than 0"),
  feed_kg_per_chicken_per_day: z.number().positive("Feed amount must be greater than 0").default(0.12)
});

export type ChickenFeedCalculationInput = z.infer<typeof chickenFeedCalculationInputSchema>;

export const livestockMedicineCalculationInputSchema = z.object({
  weight_kg: z.number().positive("Weight must be greater than 0"),
  dose_mg_per_kg: z.number().positive("Dose must be greater than 0"),
  concentration_mg_per_ml: z.number().positive("Concentration must be greater than 0").optional()
});

export type LivestockMedicineCalculationInput = z.infer<typeof livestockMedicineCalculationInputSchema>;

export const harvestEstimationCalculationInputSchema = z.object({
  area_ha: z.number().positive("Area must be greater than 0"),
  yield_ton_per_ha: z.number().positive("Yield must be greater than 0").default(5)
});

export type HarvestEstimationCalculationInput = z.infer<typeof harvestEstimationCalculationInputSchema>;

export const plantingCostCalculationInputSchema = z.object({
  area_ha: z.number().positive("Area must be greater than 0"),
  cost_rp_per_ha: z.number().positive("Cost must be greater than 0").default(1_000_000)
});

export type PlantingCostCalculationInput = z.infer<typeof plantingCostCalculationInputSchema>;

// Generic calculation input schema
export const calculationInputSchema = z.record(z.any());
export type CalculationInput = z.infer<typeof calculationInputSchema>;

// Calculation result schema
export const calculationResultSchema = z.object({
  result_value: z.number(),
  unit_label: z.string(),
  additional_info: z.record(z.any()).optional() // For additional calculation details like volume_ml
});

export type CalculationResult = z.infer<typeof calculationResultSchema>;

// API response schemas
export const authResponseSchema = z.object({
  success: z.boolean(),
  user: userSchema.omit({ password: true }).optional(),
  message: z.string().optional()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const calculationResponseSchema = z.object({
  success: z.boolean(),
  result: calculationResultSchema.optional(),
  message: z.string().optional()
});

export type CalculationResponse = z.infer<typeof calculationResponseSchema>;

// Dashboard/History schemas
export const userHistorySchema = z.object({
  id: z.number(),
  calculator_name: z.string(),
  calculator_slug: z.string(),
  input_summary: z.string(), // Human-readable summary of inputs
  result_value: z.number(),
  unit_label: z.string(),
  created_at: z.coerce.date()
});

export type UserHistory = z.infer<typeof userHistorySchema>;

export const deleteResultInputSchema = z.object({
  result_id: z.number(),
  user_id: z.number() // For authorization check
});

export type DeleteResultInput = z.infer<typeof deleteResultInputSchema>;