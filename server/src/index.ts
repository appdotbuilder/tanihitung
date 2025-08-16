import { initTRPC, TRPCError } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import {
  createUserInputSchema,
  loginInputSchema,
  createCalculatorInputSchema,
  calculationInputSchema,
  createResultInputSchema,
  deleteResultInputSchema
} from './schema';

// Import handlers
import { register, login, getUserById } from './handlers/auth';
import { 
  getCalculators, 
  getCalculatorBySlug, 
  getCalculatorsByCategory, 
  createCalculator,
  searchCalculators 
} from './handlers/calculators';
import { 
  calculate, 
  validateCalculationInputs 
} from './handlers/calculations';
import { 
  saveResult, 
  getUserHistory, 
  deleteUserResult,
  exportUserHistoryCSV,
  getResultById,
  generateInputSummary
} from './handlers/results';
import { runSeeds } from './handlers/seed';
import { connectDatabase, checkDatabaseHealth } from './handlers/database';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Define context type
type Context = {
  userId?: number;
};

// Simple middleware for authentication (placeholder implementation)
const authenticatedProcedure = publicProcedure.use(async (opts) => {
  // This is a placeholder! Real implementation should verify JWT token or session
  const ctx = opts.ctx as Context;
  const userId = ctx.userId; // This should come from session/token validation
  if (!userId) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED', 
      message: 'Authentication required' 
    });
  }
  return opts.next({
    ctx: {
      ...ctx,
      userId
    }
  });
});

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(async () => {
    const dbHealthy = await checkDatabaseHealth();
    return { 
      status: dbHealthy ? 'ok' : 'error', 
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString() 
    };
  }),

  // Authentication routes
  auth: router({
    register: publicProcedure
      .input(createUserInputSchema)
      .mutation(({ input }) => register(input)),
    
    login: publicProcedure
      .input(loginInputSchema)
      .mutation(({ input }) => login(input)),
    
    getProfile: authenticatedProcedure
      .query(({ ctx }) => getUserById(ctx.userId))
  }),

  // Calculator routes
  calculators: router({
    getAll: publicProcedure
      .query(() => getCalculators()),
    
    getBySlug: publicProcedure
      .input(z.string())
      .query(({ input }) => getCalculatorBySlug(input)),
    
    getByCategory: publicProcedure
      .input(z.enum(['farming', 'livestock']).optional())
      .query(({ input }) => getCalculatorsByCategory(input)),
    
    search: publicProcedure
      .input(z.string())
      .query(({ input }) => searchCalculators(input)),
    
    create: publicProcedure
      .input(createCalculatorInputSchema)
      .mutation(({ input }) => createCalculator(input))
  }),

  // Calculation routes
  calculations: router({
    calculate: publicProcedure
      .input(z.object({
        formulaKey: z.string(),
        inputs: calculationInputSchema
      }))
      .mutation(({ input }) => calculate(input.formulaKey, input.inputs)),
    
    validate: publicProcedure
      .input(z.object({
        formulaKey: z.string(),
        inputs: calculationInputSchema
      }))
      .query(({ input }) => validateCalculationInputs(input.formulaKey, input.inputs))
  }),

  // Result management routes (authenticated)
  results: router({
    save: authenticatedProcedure
      .input(createResultInputSchema.omit({ user_id: true }))
      .mutation(({ input, ctx }) => 
        saveResult({ ...input, user_id: ctx.userId })
      ),
    
    getHistory: authenticatedProcedure
      .query(({ ctx }) => getUserHistory(ctx.userId)),
    
    delete: authenticatedProcedure
      .input(deleteResultInputSchema.omit({ user_id: true }))
      .mutation(({ input, ctx }) => 
        deleteUserResult({ ...input, user_id: ctx.userId })
      ),
    
    exportCSV: authenticatedProcedure
      .query(({ ctx }) => exportUserHistoryCSV(ctx.userId)),
    
    getById: authenticatedProcedure
      .input(z.number())
      .query(({ input, ctx }) => getResultById(input, ctx.userId))
  }),

  // Utility routes
  utils: router({
    generateInputSummary: publicProcedure
      .input(z.object({
        calculatorSlug: z.string(),
        inputJson: z.record(z.any())
      }))
      .query(({ input }) => generateInputSummary(input.calculatorSlug, input.inputJson))
  }),

  // Admin/Development routes
  admin: router({
    seed: publicProcedure
      .mutation(() => runSeeds())
  })
});

export type AppRouter = typeof appRouter;

// Context creation function
function createContext(opts: { req: any; res: any }): Context {
  // This is a placeholder! Real implementation should extract user from JWT token or session
  // For now, return empty context
  return {
    userId: undefined
  };
}

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  
  // Initialize database connection
  try {
    await connectDatabase();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
  
  // Run seeding if SEED_ON_START environment variable is set
  if (process.env['SEED_ON_START'] === 'true') {
    try {
      console.log('Running database seeding...');
      await runSeeds();
    } catch (error) {
      console.error('Failed to seed database:', error);
    }
  }
  
  const server = createHTTPServer({
    middleware: cors({
      origin: process.env['CLIENT_URL'] || 'http://localhost:3000',
      credentials: true
    }),
    router: appRouter,
    createContext,
  });
  
  server.listen(port);
  console.log(`🚀 TaniHitung TRPC server listening at port: ${port}`);
  console.log(`📡 API endpoints available at: http://localhost:${port}/trpc`);
  console.log(`🌱 Farm & Livestock Calculator API ready!`);
}

// Import z for validation (missing import)
start().catch(console.error);