import { db } from '../db';
import { calculatorsTable } from '../db/schema';
import { type Calculator, type CreateCalculatorInput } from '../schema';
import { eq, ilike, or, asc, desc } from 'drizzle-orm';

export async function getCalculators(): Promise<Calculator[]> {
  try {
    // Fetch all calculators ordered by category and name for display in the calculators list page
    const results = await db.select()
      .from(calculatorsTable)
      .orderBy(asc(calculatorsTable.category), asc(calculatorsTable.name))
      .execute();

    // Return results directly - no numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Failed to fetch calculators:', error);
    throw error;
  }
}

export async function getCalculatorBySlug(slug: string): Promise<Calculator | null> {
  try {
    // Fetch a specific calculator by its slug for display on individual calculator pages
    const results = await db.select()
      .from(calculatorsTable)
      .where(eq(calculatorsTable.slug, slug))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch calculator by slug:', error);
    throw error;
  }
}

export async function getCalculatorsByCategory(category?: "farming" | "livestock"): Promise<Calculator[]> {
  try {
    // Build query conditionally to avoid TypeScript type issues
    const baseQuery = db.select().from(calculatorsTable);

    const results = category 
      ? await baseQuery
          .where(eq(calculatorsTable.category, category))
          .orderBy(asc(calculatorsTable.name))
          .execute()
      : await baseQuery
          .orderBy(asc(calculatorsTable.name))
          .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch calculators by category:', error);
    throw error;
  }
}

export async function createCalculator(input: CreateCalculatorInput): Promise<Calculator> {
  try {
    // Create a new calculator in the database (mainly used for seeding initial data)
    const result = await db.insert(calculatorsTable)
      .values({
        name: input.name,
        slug: input.slug,
        description: input.description,
        category: input.category,
        unit_label: input.unit_label,
        formula_key: input.formula_key
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Calculator creation failed:', error);
    throw error;
  }
}

export async function searchCalculators(query: string): Promise<Calculator[]> {
  try {
    // Search calculators by name, description, or category
    // Since we can't use ilike on enum columns, fetch all and filter in application
    const allResults = await db.select()
      .from(calculatorsTable)
      .orderBy(asc(calculatorsTable.category), asc(calculatorsTable.name))
      .execute();

    // Filter results in application code for all searchable fields
    // Trim whitespace from query for better search experience
    const lowercaseQuery = query.trim().toLowerCase();
    const filteredResults = allResults.filter(calc => 
      calc.name.toLowerCase().includes(lowercaseQuery) ||
      calc.description.toLowerCase().includes(lowercaseQuery) ||
      calc.category.toLowerCase().includes(lowercaseQuery)
    );

    return filteredResults;
  } catch (error) {
    console.error('Failed to search calculators:', error);
    throw error;
  }
}