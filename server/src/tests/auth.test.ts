import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type LoginInput } from '../schema';
import { register, login, getUserById } from '../handlers/auth';
import { eq } from 'drizzle-orm';

// Test input data
const testUserInput: CreateUserInput = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('Authentication Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await register(testUserInput);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.name).toEqual('Test User');
      expect(result.user!.email).toEqual('test@example.com');
      expect(result.user!.id).toBeDefined();
      expect(result.user!.created_at).toBeInstanceOf(Date);
      expect(result.user!.updated_at).toBeInstanceOf(Date);
      expect(result.message).toEqual('User registered successfully');
    });

    it('should hash and save password to database', async () => {
      const result = await register(testUserInput);

      // Query the database directly to verify user was saved
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.user!.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toEqual('Test User');
      expect(users[0].email).toEqual('test@example.com');
      expect(users[0].password).not.toEqual('password123'); // Password should be hashed
      expect(users[0].password.length).toBeGreaterThan(10); // Hashed password should be longer
      expect(users[0].created_at).toBeInstanceOf(Date);
      expect(users[0].updated_at).toBeInstanceOf(Date);
    });

    it('should reject duplicate email registration', async () => {
      // Register first user
      await register(testUserInput);

      // Try to register with same email
      const result = await register(testUserInput);

      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.message).toEqual('User with this email already exists');
    });

    it('should handle registration with different email', async () => {
      // Register first user
      await register(testUserInput);

      // Register with different email
      const secondUserInput: CreateUserInput = {
        ...testUserInput,
        email: 'test2@example.com'
      };
      const result = await register(secondUserInput);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.email).toEqual('test2@example.com');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await register(testUserInput);
    });

    it('should login with valid credentials', async () => {
      const result = await login(testLoginInput);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.name).toEqual('Test User');
      expect(result.user!.email).toEqual('test@example.com');
      expect(result.user!.id).toBeDefined();
      expect(result.message).toEqual('Login successful');
    });

    it('should reject login with invalid email', async () => {
      const invalidLoginInput: LoginInput = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const result = await login(invalidLoginInput);

      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.message).toEqual('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const invalidLoginInput: LoginInput = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const result = await login(invalidLoginInput);

      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.message).toEqual('Invalid email or password');
    });

    it('should not expose password in login response', async () => {
      const result = await login(testLoginInput);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect((result.user as any).password).toBeUndefined();
    });
  });

  describe('getUserById', () => {
    let userId: number;

    beforeEach(async () => {
      // Create a user and get the ID
      const registerResult = await register(testUserInput);
      userId = registerResult.user!.id;
    });

    it('should get user by valid ID', async () => {
      const result = await getUserById(userId);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.id).toEqual(userId);
      expect(result.user!.name).toEqual('Test User');
      expect(result.user!.email).toEqual('test@example.com');
      expect(result.user!.created_at).toBeInstanceOf(Date);
      expect(result.user!.updated_at).toBeInstanceOf(Date);
    });

    it('should reject invalid user ID', async () => {
      const result = await getUserById(999999);

      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.message).toEqual('User not found');
    });

    it('should not expose password in getUserById response', async () => {
      const result = await getUserById(userId);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect((result.user as any).password).toBeUndefined();
    });
  });

  describe('password security', () => {
    it('should create different hashes for same password', async () => {
      // Register two users with same password
      const user1Result = await register(testUserInput);
      
      const user2Input: CreateUserInput = {
        ...testUserInput,
        email: 'test2@example.com'
      };
      const user2Result = await register(user2Input);

      // Get both users from database
      const user1 = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, user1Result.user!.id))
        .execute();
      
      const user2 = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, user2Result.user!.id))
        .execute();

      // Hashes should be different even with same password (due to salt)
      expect(user1[0].password).not.toEqual(user2[0].password);
      expect(user1[0].password).not.toEqual('password123');
      expect(user2[0].password).not.toEqual('password123');
    });

    it('should verify password correctly after hashing', async () => {
      // Register user
      await register(testUserInput);

      // Login should work with original password
      const loginResult = await login(testLoginInput);
      expect(loginResult.success).toBe(true);

      // Login should fail with wrong password
      const wrongPasswordResult = await login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      expect(wrongPasswordResult.success).toBe(false);
    });
  });
});