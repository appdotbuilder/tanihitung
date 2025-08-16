import { db } from '../db';
import { calculatorsTable, usersTable } from '../db/schema';
import { type CreateCalculatorInput, type CreateUserInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function seedCalculators(): Promise<void> {
    const initialCalculators: CreateCalculatorInput[] = [
        {
            name: "Fertilizer Requirement",
            slug: "fertilizer-requirement",
            description: "Calculate how much fertilizer you need for your farm area",
            category: "farming",
            unit_label: "kg",
            formula_key: "fertilizer-requirement"
        },
        {
            name: "Chicken Daily Feed Requirement",
            slug: "chicken-feed-daily",
            description: "Calculate daily feed requirement for your chickens",
            category: "livestock",
            unit_label: "kg/day",
            formula_key: "chicken-feed-daily"
        },
        {
            name: "Livestock Medicine Dosage",
            slug: "livestock-medicine-dosage",
            description: "Calculate proper medicine dosage based on animal weight",
            category: "livestock",
            unit_label: "mg",
            formula_key: "livestock-medicine-dosage"
        },
        {
            name: "Harvest Estimation",
            slug: "harvest-estimation",
            description: "Estimate your harvest yield based on farm area",
            category: "farming",
            unit_label: "ton",
            formula_key: "harvest-estimation"
        },
        {
            name: "Planting Cost",
            slug: "planting-cost",
            description: "Calculate total planting costs for your farm area",
            category: "farming",
            unit_label: "Rp",
            formula_key: "planting-cost"
        }
    ];

    try {
        // Create each calculator
        for (const calculatorData of initialCalculators) {
            // Check if calculator already exists
            const existing = await db.select()
                .from(calculatorsTable)
                .where(eq(calculatorsTable.slug, calculatorData.slug))
                .execute();

            if (existing.length === 0) {
                await db.insert(calculatorsTable)
                    .values({
                        name: calculatorData.name,
                        slug: calculatorData.slug,
                        description: calculatorData.description,
                        category: calculatorData.category,
                        unit_label: calculatorData.unit_label,
                        formula_key: calculatorData.formula_key
                    })
                    .execute();

                console.log(`Created calculator: ${calculatorData.name}`);
            } else {
                console.log(`Calculator already exists: ${calculatorData.name}`);
            }
        }
        
        console.log('Calculator seeding completed');
    } catch (error) {
        console.error('Calculator seeding failed:', error);
        throw error;
    }
}

export async function seedTestUser(): Promise<void> {
    const testUserData: CreateUserInput = {
        name: "Test User",
        email: "test@example.com",
        password: "password123"
    };

    try {
        // Check if test user already exists
        const existing = await db.select()
            .from(usersTable)
            .where(eq(usersTable.email, testUserData.email))
            .execute();

        if (existing.length === 0) {
            await db.insert(usersTable)
                .values({
                    name: testUserData.name,
                    email: testUserData.email,
                    password: testUserData.password // In real implementation, this would be hashed
                })
                .execute();

            console.log(`Created test user: ${testUserData.email}`);
        } else {
            console.log(`Test user already exists: ${testUserData.email}`);
        }

        console.log('Test user seeding completed');
    } catch (error) {
        console.error('Test user seeding failed:', error);
        throw error;
    }
}

export async function runSeeds(): Promise<void> {
    console.log('Starting database seeding...');
    
    try {
        await seedTestUser();
        await seedCalculators();
        console.log('All seeds completed successfully');
    } catch (error) {
        console.error('Seeding failed:', error);
        throw error;
    }
}