import { ZodError } from 'zod';

export function formatValidationError(error: ZodError): string {
  try {
    const firstError = error.errors[0];
    if (!firstError) return "Invalid input";
    
    const field = firstError.path.length > 0 ? firstError.path.join('.') : 'input';
    const message = firstError.message;
    
    // Map common validation errors to user-friendly messages
    if (message.includes('positive')) {
      return `Enter a number greater than 0${field !== 'input' ? ` for ${field}` : ''}`;
    }
    
    if (message.includes('email') || message.toLowerCase().includes('valid email')) {
      return 'Enter a valid email address';
    }
    
    if (message.includes('required') || message.includes('Required')) {
      return field !== 'input' ? `${field} is required` : 'This field is required';
    }
    
    if (message.includes('integer') || message.includes('whole number')) {
      return `${field !== 'input' ? field : 'Value'} must be a whole number`;
    }
    
    if (message.includes('minimum') || message.includes('at least')) {
      const match = message.match(/(\d+)/);
      const minLength = match ? match[1] : '6';
      return `${field !== 'input' ? field : 'Input'} must be at least ${minLength} characters`;
    }
    
    if (message.includes('Invalid enum value') || message.includes('Expected')) {
      return `Please select a valid option${field !== 'input' ? ` for ${field}` : ''}`;
    }
    
    // Return cleaned up message with proper capitalization
    return message.charAt(0).toUpperCase() + message.slice(1);
    
  } catch (formatError) {
    console.error('Error formatting validation error:', formatError);
    return 'Invalid input';
  }
}

export function validatePositiveNumber(value: unknown, fieldName: string): number {
  try {
    // Handle string numbers
    let numValue: number;
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value.trim());
      if (isNaN(parsed)) {
        throw new Error(`Enter a valid number for ${fieldName}`);
      }
      numValue = parsed;
    } else if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        throw new Error(`Enter a valid number for ${fieldName}`);
      }
      numValue = value;
    } else {
      throw new Error(`Enter a valid number for ${fieldName}`);
    }
    
    if (numValue <= 0) {
      throw new Error(`Enter a number greater than 0 for ${fieldName}`);
    }
    
    return numValue;
    
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Enter a valid number for ${fieldName}`);
  }
}

export function validateEmail(email: unknown): string {
  try {
    if (typeof email !== 'string') {
      throw new Error('Enter a valid email address');
    }
    
    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length === 0) {
      throw new Error('Email address is required');
    }
    
    // More comprehensive email regex - requires at least one dot in domain, no leading/trailing dots in local part
    const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error('Enter a valid email address');
    }
    
    // Additional basic checks
    if (trimmedEmail.length > 254) {
      throw new Error('Email address is too long');
    }
    
    const [localPart, domain] = trimmedEmail.split('@');
    if (localPart.length > 64) {
      throw new Error('Email address is invalid');
    }
    
    return trimmedEmail.toLowerCase();
    
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Enter a valid email address');
  }
}

export function validatePasswordStrength(password: unknown): string {
  try {
    if (typeof password !== 'string') {
      throw new Error('Password must be text');
    }
    
    if (password.length === 0) {
      throw new Error('Password is required');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    if (password.length > 128) {
      throw new Error('Password is too long');
    }
    
    // Check for common weak passwords
    const commonWeakPasswords = ['password', 'qwerty', 'abc123'];
    if (commonWeakPasswords.includes(password.toLowerCase())) {
      throw new Error('Password is too common. Please choose a stronger password');
    }
    
    return password;
    
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Password must be text');
  }
}

export function sanitizeInput(input: unknown): string {
  try {
    // Convert to string
    let stringInput: string;
    
    if (input === null || input === undefined) {
      return '';
    }
    
    if (typeof input === 'string') {
      stringInput = input;
    } else {
      stringInput = String(input);
    }
    
    // Basic sanitization steps
    let sanitized = stringInput
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove other potentially dangerous tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      // Remove javascript: and data: URLs
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      // Remove event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
      // Trim whitespace
      .trim();
    
    // Additional HTML entity encoding for common dangerous characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    return sanitized;
    
  } catch (error) {
    console.error('Error sanitizing input:', error);
    return '';
  }
}