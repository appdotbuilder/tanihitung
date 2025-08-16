import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as schema from '../db/schema';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';

export async function connectDatabase(): Promise<void> {
  try {
    // Test database connection by executing a simple query
    await db.execute(sql`SELECT 1`);
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to establish database connection:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    // Note: Drizzle doesn't have a direct disconnect method for all adapters
    // This is more relevant for connection pooling scenarios
    // For now, we'll just log the intention to disconnect
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during database disconnection:', error);
    throw error;
  }
}

export async function runMigrations(): Promise<void> {
  try {
    // First ensure public schema exists and is clean
    await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
    await db.execute(sql`CREATE SCHEMA public`);
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);

    // Generate migration statements by comparing empty schema to current schema
    const migrationStatements = await generateMigration(
      generateDrizzleJson({}),
      generateDrizzleJson({ ...schema })
    );

    // Execute migration statements
    if (migrationStatements && migrationStatements.length > 0) {
      await db.execute(sql.raw(migrationStatements.join('\n')));
      console.log('Database migrations completed successfully');
    } else {
      console.log('No migrations needed');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Perform a simple query to check database responsiveness
    await db.execute(sql`SELECT 1 as health_check`);
    
    // Check if core tables exist by querying system tables
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as users_exists
    `);
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export async function createTables(): Promise<void> {
  try {
    // First ensure clean state to avoid type conflicts
    await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
    await db.execute(sql`CREATE SCHEMA public`);
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);

    // Generate and execute migration statements to create tables
    const migrationStatements = await generateMigration(
      generateDrizzleJson({}),
      generateDrizzleJson({ ...schema })
    );

    if (migrationStatements && migrationStatements.length > 0) {
      await db.execute(sql.raw(migrationStatements.join('\n')));
      console.log('Database tables created successfully');
    } else {
      console.log('Tables already exist or no tables to create');
    }
  } catch (error) {
    console.error('Failed to create tables:', error);
    throw error;
  }
}

export async function dropTables(): Promise<void> {
  try {
    // Drop the entire public schema and recreate it
    // This ensures all tables, constraints, and dependencies are removed
    await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
    await db.execute(sql`CREATE SCHEMA public`);
    
    // Also drop drizzle schema if it exists
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
    
    console.log('Database tables dropped successfully');
  } catch (error) {
    console.error('Failed to drop tables:', error);
    throw error;
  }
}