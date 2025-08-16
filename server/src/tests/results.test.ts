import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, calculatorsTable, resultsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { 
    saveResult, 
    getUserHistory, 
    deleteUserResult, 
    exportUserHistoryCSV, 
    getResultById, 
    generateInputSummary 
} from '../handlers/results';
import { 
    type CreateResultInput, 
    type DeleteResultInput 
} from '../schema';

// Test data
const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
};

const testCalculator = {
    name: 'Fertilizer Calculator',
    slug: 'fertilizer-requirement',
    description: 'Calculate fertilizer requirements',
    category: 'farming' as const,
    unit_label: 'kg',
    formula_key: 'fertilizer_calc'
};

const testResultInput: CreateResultInput = {
    user_id: 1,
    calculator_id: 1,
    input_json: { area_ha: 2.5, dose_kg_per_ha: 100 },
    result_value: 250,
    unit_label: 'kg'
};

describe('Results Handlers', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    describe('saveResult', () => {
        it('should save a result successfully', async () => {
            // Create prerequisite data
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
            
            const calculatorResult = await db.insert(calculatorsTable)
                .values(testCalculator)
                .returning()
                .execute();

            const input: CreateResultInput = {
                ...testResultInput,
                user_id: userResult[0].id,
                calculator_id: calculatorResult[0].id
            };

            const result = await saveResult(input);

            expect(result.id).toBeDefined();
            expect(result.user_id).toBe(input.user_id);
            expect(result.calculator_id).toBe(input.calculator_id);
            expect(result.input_json).toEqual(input.input_json);
            expect(result.result_value).toBe(250);
            expect(typeof result.result_value).toBe('number');
            expect(result.unit_label).toBe('kg');
            expect(result.created_at).toBeInstanceOf(Date);
        });

        it('should save result to database correctly', async () => {
            // Create prerequisite data
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
            
            const calculatorResult = await db.insert(calculatorsTable)
                .values(testCalculator)
                .returning()
                .execute();

            const input: CreateResultInput = {
                ...testResultInput,
                user_id: userResult[0].id,
                calculator_id: calculatorResult[0].id
            };

            const result = await saveResult(input);

            // Verify in database
            const dbResults = await db.select()
                .from(resultsTable)
                .where(eq(resultsTable.id, result.id))
                .execute();

            expect(dbResults).toHaveLength(1);
            expect(dbResults[0].user_id).toBe(input.user_id);
            expect(dbResults[0].calculator_id).toBe(input.calculator_id);
            expect(dbResults[0].input_json).toEqual(input.input_json);
            expect(parseFloat(dbResults[0].result_value)).toBe(250);
        });

        it('should throw error for non-existent user', async () => {
            // Create only calculator
            const calculatorResult = await db.insert(calculatorsTable)
                .values(testCalculator)
                .returning()
                .execute();

            const input: CreateResultInput = {
                ...testResultInput,
                user_id: 999, // Non-existent user
                calculator_id: calculatorResult[0].id
            };

            await expect(saveResult(input)).rejects.toThrow(/User with ID 999 not found/);
        });

        it('should throw error for non-existent calculator', async () => {
            // Create only user
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const input: CreateResultInput = {
                ...testResultInput,
                user_id: userResult[0].id,
                calculator_id: 999 // Non-existent calculator
            };

            await expect(saveResult(input)).rejects.toThrow(/Calculator with ID 999 not found/);
        });
    });

    describe('getUserHistory', () => {
        it('should return user history with calculator details', async () => {
            // Create prerequisite data
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
            
            const calculatorResult = await db.insert(calculatorsTable)
                .values(testCalculator)
                .returning()
                .execute();

            // Create test results
            const input1: CreateResultInput = {
                user_id: userResult[0].id,
                calculator_id: calculatorResult[0].id,
                input_json: { area_ha: 2.5, dose_kg_per_ha: 100 },
                result_value: 250,
                unit_label: 'kg'
            };

            const input2: CreateResultInput = {
                user_id: userResult[0].id,
                calculator_id: calculatorResult[0].id,
                input_json: { area_ha: 1.0, dose_kg_per_ha: 120 },
                result_value: 120,
                unit_label: 'kg'
            };

            await saveResult(input1);
            await saveResult(input2);

            const history = await getUserHistory(userResult[0].id);

            expect(history).toHaveLength(2);
            
            // Results should be ordered by created_at desc (newest first)
            expect(history[0].result_value).toBe(120);
            expect(history[1].result_value).toBe(250);
            
            // Check structure
            expect(history[0].calculator_name).toBe('Fertilizer Calculator');
            expect(history[0].calculator_slug).toBe('fertilizer-requirement');
            expect(history[0].input_summary).toBe('Area: 1 ha, Dose: 120 kg/ha');
            expect(history[0].unit_label).toBe('kg');
            expect(history[0].created_at).toBeInstanceOf(Date);
        });

        it('should return empty array for user with no results', async () => {
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const history = await getUserHistory(userResult[0].id);

            expect(history).toHaveLength(0);
        });

        it('should only return results for specified user', async () => {
            // Create two users
            const user1Result = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
                
            const user2Result = await db.insert(usersTable)
                .values({ ...testUser, email: 'user2@example.com' })
                .returning()
                .execute();
            
            const calculatorResult = await db.insert(calculatorsTable)
                .values(testCalculator)
                .returning()
                .execute();

            // Create results for both users
            await saveResult({
                ...testResultInput,
                user_id: user1Result[0].id,
                calculator_id: calculatorResult[0].id
            });

            await saveResult({
                ...testResultInput,
                user_id: user2Result[0].id,
                calculator_id: calculatorResult[0].id,
                result_value: 500
            });

            const user1History = await getUserHistory(user1Result[0].id);
            const user2History = await getUserHistory(user2Result[0].id);

            expect(user1History).toHaveLength(1);
            expect(user2History).toHaveLength(1);
            expect(user1History[0].result_value).toBe(250);
            expect(user2History[0].result_value).toBe(500);
        });
    });

    describe('deleteUserResult', () => {
        it('should delete user result successfully', async () => {
            // Create prerequisite data and result
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
            
            const calculatorResult = await db.insert(calculatorsTable)
                .values(testCalculator)
                .returning()
                .execute();

            const savedResult = await saveResult({
                ...testResultInput,
                user_id: userResult[0].id,
                calculator_id: calculatorResult[0].id
            });

            const deleteInput: DeleteResultInput = {
                result_id: savedResult.id,
                user_id: userResult[0].id
            };

            const deleted = await deleteUserResult(deleteInput);

            expect(deleted).toBe(true);

            // Verify deletion
            const remainingResults = await db.select()
                .from(resultsTable)
                .where(eq(resultsTable.id, savedResult.id))
                .execute();

            expect(remainingResults).toHaveLength(0);
        });

        it('should not delete result belonging to different user', async () => {
            // Create two users
            const user1Result = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
                
            const user2Result = await db.insert(usersTable)
                .values({ ...testUser, email: 'user2@example.com' })
                .returning()
                .execute();
            
            const calculatorResult = await db.insert(calculatorsTable)
                .values(testCalculator)
                .returning()
                .execute();

            // Create result for user1
            const savedResult = await saveResult({
                ...testResultInput,
                user_id: user1Result[0].id,
                calculator_id: calculatorResult[0].id
            });

            // Try to delete as user2 (unauthorized)
            const deleteInput: DeleteResultInput = {
                result_id: savedResult.id,
                user_id: user2Result[0].id
            };

            const deleted = await deleteUserResult(deleteInput);

            expect(deleted).toBe(false);

            // Verify result still exists
            const remainingResults = await db.select()
                .from(resultsTable)
                .where(eq(resultsTable.id, savedResult.id))
                .execute();

            expect(remainingResults).toHaveLength(1);
        });

        it('should return false for non-existent result', async () => {
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const deleteInput: DeleteResultInput = {
                result_id: 999,
                user_id: userResult[0].id
            };

            const deleted = await deleteUserResult(deleteInput);

            expect(deleted).toBe(false);
        });
    });

    describe('getResultById', () => {
        it('should return result by ID without user check', async () => {
            // Create prerequisite data and result
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
            
            const calculatorResult = await db.insert(calculatorsTable)
                .values(testCalculator)
                .returning()
                .execute();

            const savedResult = await saveResult({
                ...testResultInput,
                user_id: userResult[0].id,
                calculator_id: calculatorResult[0].id
            });

            const result = await getResultById(savedResult.id);

            expect(result).not.toBeNull();
            expect(result!.id).toBe(savedResult.id);
            expect(result!.user_id).toBe(userResult[0].id);
            expect(result!.result_value).toBe(250);
            expect(typeof result!.result_value).toBe('number');
        });

        it('should return result by ID with user authorization', async () => {
            // Create prerequisite data and result
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
            
            const calculatorResult = await db.insert(calculatorsTable)
                .values(testCalculator)
                .returning()
                .execute();

            const savedResult = await saveResult({
                ...testResultInput,
                user_id: userResult[0].id,
                calculator_id: calculatorResult[0].id
            });

            const result = await getResultById(savedResult.id, userResult[0].id);

            expect(result).not.toBeNull();
            expect(result!.id).toBe(savedResult.id);
            expect(result!.user_id).toBe(userResult[0].id);
        });

        it('should return null for unauthorized access', async () => {
            // Create two users
            const user1Result = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
                
            const user2Result = await db.insert(usersTable)
                .values({ ...testUser, email: 'user2@example.com' })
                .returning()
                .execute();
            
            const calculatorResult = await db.insert(calculatorsTable)
                .values(testCalculator)
                .returning()
                .execute();

            // Create result for user1
            const savedResult = await saveResult({
                ...testResultInput,
                user_id: user1Result[0].id,
                calculator_id: calculatorResult[0].id
            });

            // Try to access as user2
            const result = await getResultById(savedResult.id, user2Result[0].id);

            expect(result).toBeNull();
        });

        it('should return null for non-existent result', async () => {
            const result = await getResultById(999);

            expect(result).toBeNull();
        });
    });

    describe('exportUserHistoryCSV', () => {
        it('should generate CSV export correctly', async () => {
            // Create prerequisite data and results
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
            
            const calculatorResult = await db.insert(calculatorsTable)
                .values(testCalculator)
                .returning()
                .execute();

            await saveResult({
                ...testResultInput,
                user_id: userResult[0].id,
                calculator_id: calculatorResult[0].id
            });

            const csv = await exportUserHistoryCSV(userResult[0].id);

            expect(csv).toContain('Date,Calculator,Input Summary,Result,Unit');
            expect(csv).toContain('Fertilizer Calculator');
            expect(csv).toContain('Area: 2.5 ha, Dose: 100 kg/ha');
            expect(csv).toContain('250');
            expect(csv).toContain('kg');
        });

        it('should return header only for user with no history', async () => {
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const csv = await exportUserHistoryCSV(userResult[0].id);

            expect(csv).toBe('Date,Calculator,Input Summary,Result,Unit\n');
        });
    });

    describe('generateInputSummary', () => {
        it('should generate fertilizer requirement summary', async () => {
            const summary = await generateInputSummary('fertilizer-requirement', {
                area_ha: 2.5,
                dose_kg_per_ha: 100
            });

            expect(summary).toBe('Area: 2.5 ha, Dose: 100 kg/ha');
        });

        it('should generate chicken feed summary', async () => {
            const summary = await generateInputSummary('chicken-feed-daily', {
                chicken_count: 50,
                feed_kg_per_chicken_per_day: 0.12
            });

            expect(summary).toBe('Chickens: 50, Feed per chicken: 0.12 kg/day');
        });

        it('should generate livestock medicine summary with concentration', async () => {
            const summary = await generateInputSummary('livestock-medicine-dosage', {
                weight_kg: 500,
                dose_mg_per_kg: 20,
                concentration_mg_per_ml: 200
            });

            expect(summary).toBe('Weight: 500 kg, Dose: 20 mg/kg, Concentration: 200 mg/ml');
        });

        it('should generate livestock medicine summary without concentration', async () => {
            const summary = await generateInputSummary('livestock-medicine-dosage', {
                weight_kg: 500,
                dose_mg_per_kg: 20
            });

            expect(summary).toBe('Weight: 500 kg, Dose: 20 mg/kg');
        });

        it('should generate harvest estimation summary', async () => {
            const summary = await generateInputSummary('harvest-estimation', {
                area_ha: 3.0,
                yield_ton_per_ha: 4.5
            });

            expect(summary).toBe('Area: 3 ha, Yield: 4.5 ton/ha');
        });

        it('should generate planting cost summary', async () => {
            const summary = await generateInputSummary('planting-cost', {
                area_ha: 2.0,
                cost_rp_per_ha: 1500000
            });

            expect(summary).toBe('Area: 2 ha, Cost per ha: Rp 1,500,000');
        });

        it('should return JSON string for unknown calculator', async () => {
            const inputJson = { unknown_field: 'test' };
            const summary = await generateInputSummary('unknown-calculator', inputJson);

            expect(summary).toBe(JSON.stringify(inputJson));
        });

        it('should handle errors gracefully', async () => {
            // Test with circular reference that would break JSON.stringify
            const circularObj: any = { test: 'value' };
            circularObj.circular = circularObj;

            const summary = await generateInputSummary('unknown-calculator', circularObj);
            
            // Should return a safe string representation, either with [Circular] or [Complex Object]
            expect(typeof summary).toBe('string');
            expect(summary).toMatch(/\[Circular\]|\[Complex Object\]/);
        });
    });
});