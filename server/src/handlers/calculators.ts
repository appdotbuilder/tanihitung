import { type Calculator, type CreateCalculatorInput } from '../schema';

export async function getCalculators(): Promise<Calculator[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to fetch all calculators from the database,
    // ordered by category and name for display in the calculators list page.
    return [
        {
            id: 1,
            name: "Fertilizer Requirement",
            slug: "fertilizer-requirement",
            description: "Calculate how much fertilizer you need for your farm area",
            category: "farming" as const,
            unit_label: "kg",
            formula_key: "fertilizer-requirement",
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            name: "Chicken Daily Feed Requirement",
            slug: "chicken-feed-daily",
            description: "Calculate daily feed requirement for your chickens",
            category: "livestock" as const,
            unit_label: "kg/day",
            formula_key: "chicken-feed-daily",
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 3,
            name: "Livestock Medicine Dosage",
            slug: "livestock-medicine-dosage",
            description: "Calculate proper medicine dosage based on animal weight",
            category: "livestock" as const,
            unit_label: "mg",
            formula_key: "livestock-medicine-dosage",
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 4,
            name: "Harvest Estimation",
            slug: "harvest-estimation",
            description: "Estimate your harvest yield based on farm area",
            category: "farming" as const,
            unit_label: "ton",
            formula_key: "harvest-estimation",
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 5,
            name: "Planting Cost",
            slug: "planting-cost",
            description: "Calculate total planting costs for your farm area",
            category: "farming" as const,
            unit_label: "Rp",
            formula_key: "planting-cost",
            created_at: new Date(),
            updated_at: new Date()
        }
    ];
}

export async function getCalculatorBySlug(slug: string): Promise<Calculator | null> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to fetch a specific calculator by its slug
    // for display on individual calculator pages.
    const calculators = await getCalculators();
    return calculators.find(calc => calc.slug === slug) || null;
}

export async function getCalculatorsByCategory(category?: "farming" | "livestock"): Promise<Calculator[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to fetch calculators filtered by category
    // for the category filter functionality.
    const calculators = await getCalculators();
    if (!category) return calculators;
    return calculators.filter(calc => calc.category === category);
}

export async function createCalculator(input: CreateCalculatorInput): Promise<Calculator> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to create a new calculator in the database
    // (mainly used for seeding initial data).
    return {
        id: Math.floor(Math.random() * 1000), // Placeholder ID
        name: input.name,
        slug: input.slug,
        description: input.description,
        category: input.category,
        unit_label: input.unit_label,
        formula_key: input.formula_key,
        created_at: new Date(),
        updated_at: new Date()
    };
}

export async function searchCalculators(query: string): Promise<Calculator[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to search calculators by name, description, or category
    // for the search functionality on the home page.
    const calculators = await getCalculators();
    const lowercaseQuery = query.toLowerCase();
    return calculators.filter(calc => 
        calc.name.toLowerCase().includes(lowercaseQuery) ||
        calc.description.toLowerCase().includes(lowercaseQuery) ||
        calc.category.toLowerCase().includes(lowercaseQuery)
    );
}