import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type LoginInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export async function register(input: CreateUserInput): Promise<AuthResponse> {
  try {
    // Check if user with this email already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUser.length > 0) {
      return {
        success: false,
        message: "User with this email already exists"
      };
    }

    // Hash password using Bun's built-in password hashing
    const hashedPassword = await Bun.password.hash(input.password);

    // Insert new user
    const result = await db.insert(usersTable)
      .values({
        name: input.name,
        email: input.email,
        password: hashedPassword
      })
      .returning()
      .execute();

    const user = result[0];
    
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      message: "User registered successfully"
    };
  } catch (error) {
    console.error('User registration failed:', error);
    return {
      success: false,
      message: "Registration failed"
    };
  }
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return {
        success: false,
        message: "Invalid email or password"
      };
    }

    const user = users[0];

    // Verify password using Bun's built-in password verification
    const isValidPassword = await Bun.password.verify(input.password, user.password);

    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid email or password"
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      message: "Login successful"
    };
  } catch (error) {
    console.error('User login failed:', error);
    return {
      success: false,
      message: "Login failed"
    };
  }
}

export async function getUserById(userId: number): Promise<AuthResponse> {
  try {
    // Find user by ID
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      return {
        success: false,
        message: "User not found"
      };
    }

    const user = users[0];

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  } catch (error) {
    console.error('Get user by ID failed:', error);
    return {
      success: false,
      message: "Failed to retrieve user"
    };
  }
}