import { ZodError } from 'zod';

export function formatValidationError(error: ZodError): string {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to format Zod validation errors into user-friendly messages
    // following the "short and simple" principle for error messages.
    
    const firstError = error.errors[0];
    if (!firstError) return "Invalid input";
    
    const field = firstError.path.join('.');
    const message = firstError.message;
    
    // Map common validation errors to user-friendly messages
    if (message.includes('positive')) {
        return `Enter a number greater than 0 for ${field}`;
    }
    if (message.includes('email')) {
        return `Enter a valid email address`;
    }
    if (message.includes('required')) {
        return `${field} is required`;
    }
    if (message.includes('integer')) {
        return `${field} must be a whole number`;
    }
    
    return message;
}

export function validatePositiveNumber(value: unknown, fieldName: string): number {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to validate that a value is a positive number
    // and return it as a number, or throw a user-friendly error.
    
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`Enter a valid number for ${fieldName}`);
    }
    
    if (value <= 0) {
        throw new Error(`Enter a number greater than 0 for ${fieldName}`);
    }
    
    return value;
}

export function validateEmail(email: unknown): string {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to validate email format and return it as string.
    
    if (typeof email !== 'string') {
        throw new Error('Enter a valid email address');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Enter a valid email address');
    }
    
    return email;
}

export function validatePasswordStrength(password: unknown): string {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to validate password strength requirements.
    
    if (typeof password !== 'string') {
        throw new Error('Password must be text');
    }
    
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }
    
    return password;
}

export function sanitizeInput(input: unknown): string {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to sanitize string inputs to prevent XSS attacks.
    
    if (typeof input !== 'string') {
        return String(input || '');
    }
    
    // Basic sanitization - in real implementation, use a proper sanitization library
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}