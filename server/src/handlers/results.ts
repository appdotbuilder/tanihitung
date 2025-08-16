import { db } from '../db';
import { resultsTable, calculatorsTable, usersTable } from '../db/schema';
import { 
    type CreateResultInput, 
    type Result, 
    type UserHistory,
    type DeleteResultInput
} from '../schema';
import { eq, and, desc, type SQL } from 'drizzle-orm';

export async function saveResult(input: CreateResultInput): Promise<Result> {
    try {
        // Verify that user and calculator exist
        const userExists = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, input.user_id))
            .limit(1)
            .execute();

        if (userExists.length === 0) {
            throw new Error(`User with ID ${input.user_id} not found`);
        }

        const calculatorExists = await db.select()
            .from(calculatorsTable)
            .where(eq(calculatorsTable.id, input.calculator_id))
            .limit(1)
            .execute();

        if (calculatorExists.length === 0) {
            throw new Error(`Calculator with ID ${input.calculator_id} not found`);
        }

        // Insert the result
        const insertResult = await db.insert(resultsTable)
            .values({
                user_id: input.user_id,
                calculator_id: input.calculator_id,
                input_json: input.input_json,
                result_value: input.result_value.toString(), // Convert to string for numeric column
                unit_label: input.unit_label
            })
            .returning()
            .execute();

        const result = insertResult[0];
        return {
            ...result,
            input_json: result.input_json as Record<string, any>, // Type assertion for unknown JSON
            result_value: parseFloat(result.result_value) // Convert back to number
        };
    } catch (error) {
        console.error('Failed to save result:', error);
        throw error;
    }
}

export async function getUserHistory(userId: number): Promise<UserHistory[]> {
    try {
        // Join results with calculators to get calculator information
        const results = await db.select({
            id: resultsTable.id,
            calculator_name: calculatorsTable.name,
            calculator_slug: calculatorsTable.slug,
            input_json: resultsTable.input_json,
            result_value: resultsTable.result_value,
            unit_label: resultsTable.unit_label,
            created_at: resultsTable.created_at
        })
        .from(resultsTable)
        .innerJoin(calculatorsTable, eq(resultsTable.calculator_id, calculatorsTable.id))
        .where(eq(resultsTable.user_id, userId))
        .orderBy(desc(resultsTable.created_at))
        .execute();

        // Generate input summaries and convert numeric values
        return await Promise.all(results.map(async (result) => {
            const input_summary = await generateInputSummary(result.calculator_slug, result.input_json as Record<string, any>);
            
            return {
                id: result.id,
                calculator_name: result.calculator_name,
                calculator_slug: result.calculator_slug,
                input_summary,
                result_value: parseFloat(result.result_value), // Convert numeric to number
                unit_label: result.unit_label,
                created_at: result.created_at
            };
        }));
    } catch (error) {
        console.error('Failed to get user history:', error);
        throw error;
    }
}

export async function deleteUserResult(input: DeleteResultInput): Promise<boolean> {
    try {
        const deleteResult = await db.delete(resultsTable)
            .where(
                and(
                    eq(resultsTable.id, input.result_id),
                    eq(resultsTable.user_id, input.user_id) // Authorization check
                )
            )
            .execute();

        return (deleteResult.rowCount ?? 0) > 0;
    } catch (error) {
        console.error('Failed to delete result:', error);
        throw error;
    }
}

export async function exportUserHistoryCSV(userId: number): Promise<string> {
    try {
        const history = await getUserHistory(userId);
        
        const csvHeader = "Date,Calculator,Input Summary,Result,Unit\n";
        const csvRows = history.map(item => 
            `"${item.created_at.toISOString()}","${item.calculator_name}","${item.input_summary}","${item.result_value}","${item.unit_label}"`
        ).join("\n");
        
        return csvHeader + csvRows;
    } catch (error) {
        console.error('Failed to export user history CSV:', error);
        throw error;
    }
}

export async function getResultById(resultId: number, userId?: number): Promise<Result | null> {
    try {
        // Build conditions array
        const conditions: SQL<unknown>[] = [eq(resultsTable.id, resultId)];
        
        if (userId !== undefined) {
            conditions.push(eq(resultsTable.user_id, userId));
        }

        const results = await db.select()
            .from(resultsTable)
            .where(conditions.length === 1 ? conditions[0] : and(...conditions))
            .limit(1)
            .execute();

        if (results.length === 0) {
            return null;
        }

        const result = results[0];
        return {
            ...result,
            input_json: result.input_json as Record<string, any>, // Type assertion for unknown JSON
            result_value: parseFloat(result.result_value) // Convert numeric to number
        };
    } catch (error) {
        console.error('Failed to get result by ID:', error);
        throw error;
    }
}

export async function generateInputSummary(calculatorSlug: string, inputJson: Record<string, any>): Promise<string> {
    try {
        switch (calculatorSlug) {
            case 'fertilizer-requirement':
                return `Area: ${inputJson['area_ha']} ha, Dose: ${inputJson['dose_kg_per_ha']} kg/ha`;
            case 'chicken-feed-daily':
                return `Chickens: ${inputJson['chicken_count']}, Feed per chicken: ${inputJson['feed_kg_per_chicken_per_day']} kg/day`;
            case 'livestock-medicine-dosage':
                const concentrationText = inputJson['concentration_mg_per_ml'] 
                    ? `, Concentration: ${inputJson['concentration_mg_per_ml']} mg/ml`
                    : '';
                return `Weight: ${inputJson['weight_kg']} kg, Dose: ${inputJson['dose_mg_per_kg']} mg/kg${concentrationText}`;
            case 'harvest-estimation':
                return `Area: ${inputJson['area_ha']} ha, Yield: ${inputJson['yield_ton_per_ha']} ton/ha`;
            case 'planting-cost':
                return `Area: ${inputJson['area_ha']} ha, Cost per ha: Rp ${Number(inputJson['cost_rp_per_ha']).toLocaleString()}`;
            default:
                return safeJsonStringify(inputJson);
        }
    } catch (error) {
        console.error('Failed to generate input summary:', error);
        return safeJsonStringify(inputJson);
    }
}

// Helper function to safely stringify JSON, handling circular references
function safeJsonStringify(obj: any): string {
    try {
        return JSON.stringify(obj);
    } catch (error) {
        // Handle circular references and other JSON errors
        try {
            const seen = new WeakSet();
            return JSON.stringify(obj, (key, val) => {
                if (val != null && typeof val === "object") {
                    if (seen.has(val)) {
                        return '[Circular]';
                    }
                    seen.add(val);
                }
                return val;
            });
        } catch {
            return '[Complex Object]';
        }
    }
}