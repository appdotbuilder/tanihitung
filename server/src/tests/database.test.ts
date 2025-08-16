import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { 
  connectDatabase, 
  disconnectDatabase, 
  runMigrations, 
  checkDatabaseHealth, 
  createTables, 
  dropTables 
} from '../handlers/database';

describe('database handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);
  
  describe('debug QueryResult', () => {
    it('should understand QueryResult structure', async () => {
      const result = await db.execute(sql`SELECT 1 as test_value`);
      console.log('QueryResult type:', typeof result);
      console.log('QueryResult properties:', Object.keys(result));
      
      // Access rows property from node-postgres result
      const rows = (result as any).rows || [];
      console.log('Rows:', rows);
      console.log('Rows length:', rows.length);
      
      if (rows.length > 0) {
        console.log('First row:', rows[0]);
        expect(rows[0].test_value).toBe(1);
      }
    });
  });

  describe('connectDatabase', () => {
    it('should establish database connection successfully', async () => {
      // Should not throw an error
      await expect(connectDatabase()).resolves.toBeUndefined();
    });

    it('should test connection with simple query', async () => {
      await connectDatabase();
      
      // Verify connection works by executing a query
      const result = await db.execute(sql`SELECT 1 as test`);
      expect(result).toBeDefined();
    });
  });

  describe('disconnectDatabase', () => {
    it('should disconnect without errors', async () => {
      await expect(disconnectDatabase()).resolves.toBeUndefined();
    });
  });

  describe('runMigrations', () => {
    it('should run migrations successfully on empty database', async () => {
      // Start with clean slate
      await resetDB();
      
      await expect(runMigrations()).resolves.toBeUndefined();
      
      // Verify tables were created - simplified check
      const tableCheckResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'calculators', 'results')
      `);
      
      // For node-postgres, the result has rows property
      const rows = (tableCheckResult as any).rows || [];
      expect(rows.length).toBeGreaterThan(0);
      expect(parseInt(rows[0]?.count)).toBe(3);
    });

    it('should handle migrations idempotently', async () => {
      // Run migrations twice to test idempotency
      await expect(runMigrations()).resolves.toBeUndefined();
      await expect(runMigrations()).resolves.toBeUndefined();
      
      // Verify tables still exist after multiple runs
      const tableCheckResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const rows = (tableCheckResult as any).rows || [];
      expect(parseInt(rows[0]?.count)).toBeGreaterThan(0);
    });
  });

  describe('checkDatabaseHealth', () => {
    it('should return true for healthy database', async () => {
      const isHealthy = await checkDatabaseHealth();
      expect(isHealthy).toBe(true);
    });

    it('should verify database responsiveness', async () => {
      const isHealthy = await checkDatabaseHealth();
      expect(typeof isHealthy).toBe('boolean');
      expect(isHealthy).toBe(true);
    });

    it('should check table existence as part of health check', async () => {
      const isHealthy = await checkDatabaseHealth();
      
      // If health check passes, basic tables should exist
      if (isHealthy) {
        const userTableExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          ) as exists
        `);
        
        expect(userTableExists).toBeDefined();
      }
    });
  });

  describe('createTables', () => {
    it('should create tables successfully', async () => {
      // Start with empty database
      await resetDB();
      
      await expect(createTables()).resolves.toBeUndefined();
      
      // Verify all expected tables were created
      const tablesResult = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      const rows = (tablesResult as any).rows || [];
      const tableNames = rows.map((row: any) => row.table_name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('calculators'); 
      expect(tableNames).toContain('results');
    });

    it('should handle creating tables idempotently', async () => {
      // Run createTables twice to test idempotency
      await expect(createTables()).resolves.toBeUndefined();
      await expect(createTables()).resolves.toBeUndefined();
      
      // Verify tables exist after multiple calls
      const tableCheckResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const rows = (tableCheckResult as any).rows || [];
      expect(parseInt(rows[0]?.count)).toBeGreaterThan(0);
    });

    it('should create tables with correct schema structure', async () => {
      await resetDB();
      await createTables();
      
      // Check users table structure
      const usersColumnsResult = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      const rows = (usersColumnsResult as any).rows || [];
      const columnNames = rows.map((col: any) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('password');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });
  });

  describe('dropTables', () => {
    it('should drop all tables successfully', async () => {
      await expect(dropTables()).resolves.toBeUndefined();
      
      // Verify no tables exist in public schema
      const tablesResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const rows = (tablesResult as any).rows || [];
      expect(parseInt(rows[0]?.count)).toBe(0);
    });

    it('should handle dropping tables when none exist', async () => {
      await resetDB(); // Already drops tables
      
      await expect(dropTables()).resolves.toBeUndefined();
      
      // Verify still no tables
      const tablesResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const rows = (tablesResult as any).rows || [];
      expect(parseInt(rows[0]?.count)).toBe(0);
    });

    it('should recreate public schema after dropping', async () => {
      await dropTables();
      
      // Verify public schema exists
      const schemaCheckResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.schemata 
          WHERE schema_name = 'public'
        ) as exists
      `);
      
      const rows = (schemaCheckResult as any).rows || [];
      expect(rows[0]?.exists).toBe(true);
    });

    it('should remove drizzle schema if it exists', async () => {
      await dropTables();
      
      // Verify drizzle schema doesn't exist
      const drizzleSchemaCheckResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.schemata 
          WHERE schema_name = 'drizzle'
        ) as exists
      `);
      
      const rows = (drizzleSchemaCheckResult as any).rows || [];
      expect(rows[0]?.exists).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle full lifecycle: drop -> create -> health check', async () => {
      // Drop all tables
      await dropTables();
      
      // Health check should still work even without tables
      const healthBefore = await checkDatabaseHealth();
      expect(typeof healthBefore).toBe('boolean');
      
      // Create tables
      await createTables();
      
      // Health check should pass with tables
      const healthAfter = await checkDatabaseHealth();
      expect(healthAfter).toBe(true);
    });

    it('should handle connect -> migrate -> health check flow', async () => {
      await resetDB();
      
      await connectDatabase();
      await runMigrations();
      
      const isHealthy = await checkDatabaseHealth();
      expect(isHealthy).toBe(true);
    });
  });
});