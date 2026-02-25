# Missing Required Fields Error - Comprehensive Troubleshooting Strategy

## Executive Summary

This guide provides a systematic approach to diagnosing and resolving "Missing required fields" errors in your Orbit application. The error occurs when the system indicates required fields are missing despite the user filling them out and submitting the form.

---

## Phase 1: Initial Diagnosis & Verification

### 1.1 Verify Form Field Completion

#### Step 1: Frontend Form Inspection
Before troubleshooting backend issues, confirm the form actually contains all filled values:

```typescript
// Add this logging to your form submission handler
export async function handleFormSubmit(formData: FormData) {
  console.log('[v0] Form Submission Started');
  
  // Log all form fields
  const fields = Object.fromEntries(formData);
  console.log('[v0] Form Fields Received:', JSON.stringify(fields, null, 2));
  
  // Check for empty strings or null values
  const emptyFields = Object.entries(fields).filter(([key, value]) => {
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
    if (isEmpty) {
      console.log(`[v0] EMPTY FIELD DETECTED: ${key} = "${value}"`);
    }
    return isEmpty;
  });
  
  if (emptyFields.length > 0) {
    console.log('[v0] Empty Fields:', emptyFields.map(([k]) => k).join(', '));
    return { error: 'Please fill out all required fields' };
  }
  
  console.log('[v0] All form fields validated and populated');
  return { success: true };
}
```

#### Step 2: React Hook Form Validation
If using React Hook Form, check field registration:

```typescript
import { useForm } from 'react-hook-form';

export function RegistrationForm() {
  const { register, watch, handleSubmit, formState: { errors } } = useForm();
  
  // Watch all fields for debugging
  const allValues = watch();
  console.log('[v0] Form Values:', allValues);
  console.log('[v0] Form Errors:', errors);
  
  const onSubmit = async (data) => {
    console.log('[v0] Form Data Before Submission:', data);
    
    // Verify all required fields are present
    const requiredFields = ['email', 'password', 'fullName'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.error('[v0] Missing fields detected:', missingFields);
      return;
    }
    
    // Proceed with submission
    await submitForm(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: 'Email is required' })} />
      <input {...register('password', { required: 'Password is required' })} />
      <input {...register('fullName', { required: 'Full name is required' })} />
    </form>
  );
}
```

#### Step 3: Network Request Inspection
Check what data is actually being sent to the server:

```typescript
// Intercept fetch requests to log payload
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  if (url.includes('/api/auth/')) {
    console.log('[v0] API Request URL:', url);
    console.log('[v0] API Request Method:', options?.method);
    console.log('[v0] API Request Headers:', options?.headers);
    
    if (options?.body) {
      try {
        const body = typeof options.body === 'string' 
          ? JSON.parse(options.body) 
          : options.body;
        console.log('[v0] API Request Body:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('[v0] API Request Body (raw):', options.body);
      }
    }
  }
  
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('[v0] API Response Status:', response.status);
      return response.clone().json().then(data => {
        console.log('[v0] API Response Body:', JSON.stringify(data, null, 2));
        return response;
      });
    })
    .catch(error => {
      console.error('[v0] API Error:', error);
      throw error;
    });
};
```

---

## Phase 2: Client-Side Validation Analysis

### 2.1 Frontend Validation Issues

#### Issue: Premature Validation Blocking
The form may prevent submission before all fields are validated:

```typescript
// PROBLEMATIC: Validates fields individually
const validateEmail = (email: string): boolean => {
  if (!email) return false; // Blocks submission if empty
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// SOLUTION: Separate validation from submission blocking
const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }
  if (!email.includes('@')) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
};

// Use for display only, not submission blocking
const emailValidation = validateEmail(email);
if (!emailValidation.valid) {
  console.log('[v0] Validation Error:', emailValidation.error);
  // Show error to user but allow submission attempt
}
```

#### Issue: Whitespace and Trimming
Fields may contain whitespace that's not being stripped:

```typescript
// PROBLEMATIC: Whitespace not trimmed
const formData = {
  email: '  user@example.com  ',
  password: 'mypassword ',
};

// SOLUTION: Trim all string fields
function trimFormData(data: Record<string, any>): Record<string, any> {
  return Object.entries(data).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'string' ? value.trim() : value;
    return acc;
  }, {});
}

const cleanData = trimFormData(formData);
console.log('[v0] Trimmed Form Data:', cleanData);
```

#### Issue: Field Name Mismatches
Frontend field names may not match backend expectations:

```typescript
// PROBLEMATIC: Field name mismatch
const formData = {
  full_name: 'John Doe', // Frontend uses snake_case
};
// Backend expects: { fullName: 'John Doe' } // camelCase

// SOLUTION: Map fields to expected backend format
const mapFormDataToAPI = (formData: Record<string, any>) => {
  const fieldMapping = {
    'full_name': 'fullName',
    'phone_number': 'phoneNumber',
    'company_name': 'companyName',
  };
  
  return Object.entries(formData).reduce((acc, [key, value]) => {
    const apiKey = fieldMapping[key] || key;
    acc[apiKey] = value;
    console.log(`[v0] Mapping ${key} -> ${apiKey}`);
    return acc;
  }, {});
};
```

### 2.2 Validation Schema Debugging

```typescript
import { z } from 'zod';

// Define validation schema with descriptive errors
const registrationSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain special character'),
  confirmPassword: z.string(),
  fullName: z.string().min(1, 'Full name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Validation function with detailed logging
function validateFormData(data: unknown) {
  console.log('[v0] Validating Form Data:', JSON.stringify(data, null, 2));
  
  const result = registrationSchema.safeParse(data);
  
  if (!result.success) {
    console.error('[v0] Validation Failed:');
    result.error.errors.forEach(error => {
      console.error(`  - ${error.path.join('.')}: ${error.message}`);
    });
    return { valid: false, errors: result.error.errors };
  }
  
  console.log('[v0] Validation Passed');
  return { valid: true, data: result.data };
}
```

---

## Phase 3: Server-Side Validation & Configuration

### 3.1 Backend Validation Review

#### Inspect API Route Validation

```typescript
// app/api/auth/register/route.ts
import { validatePassword } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log incoming data
    console.log('[v0] Register API - Received Body:', JSON.stringify(body, null, 2));
    
    const { email, password, confirmPassword, fullName } = body;
    
    // Validate input with detailed logging
    const validationErrors: string[] = [];
    
    if (!email) {
      validationErrors.push('email is required');
      console.log('[v0] Email validation failed: empty');
    } else if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      validationErrors.push('email must be valid');
      console.log('[v0] Email validation failed: invalid format');
    } else {
      console.log('[v0] Email validation passed:', email);
    }
    
    if (!password) {
      validationErrors.push('password is required');
      console.log('[v0] Password validation failed: empty');
    } else {
      const pwValidation = validatePassword(password);
      if (!pwValidation.valid) {
        validationErrors.push(...pwValidation.errors);
        console.log('[v0] Password validation failed:', pwValidation.errors);
      } else {
        console.log('[v0] Password validation passed');
      }
    }
    
    if (!confirmPassword) {
      validationErrors.push('confirmPassword is required');
      console.log('[v0] Confirm password validation failed: empty');
    }
    
    if (!fullName) {
      validationErrors.push('fullName is required');
      console.log('[v0] Full name validation failed: empty');
    } else {
      console.log('[v0] Full name validation passed:', fullName);
    }
    
    // Return detailed error response
    if (validationErrors.length > 0) {
      console.log('[v0] Validation failed with errors:', validationErrors);
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }
    
    console.log('[v0] All validations passed, proceeding to user creation');
    
    // Continue with user creation...
  } catch (error) {
    console.error('[v0] Register API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 3.2 Validation Rule Checker

```typescript
// lib/validation-rules.ts

export const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255,
    errorMessage: 'Valid email is required',
  },
  password: {
    required: true,
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
    maxLength: 128,
    errorMessage: 'Password must meet all requirements',
  },
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 255,
    errorMessage: 'Full name is required',
  },
};

export function checkValidationRule(fieldName: string, value: any): { valid: boolean; errors: string[] } {
  const rule = VALIDATION_RULES[fieldName];
  const errors: string[] = [];
  
  console.log(`[v0] Checking validation rule for ${fieldName}:`, rule);
  
  if (!rule) {
    console.warn(`[v0] No validation rule found for ${fieldName}`);
    return { valid: true, errors: [] };
  }
  
  // Check required
  if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    errors.push(`${fieldName} is required`);
    console.log(`[v0] ${fieldName} failed required check`);
  }
  
  // Check pattern
  if (rule.pattern && value && !rule.pattern.test(value)) {
    errors.push(`${fieldName} has invalid format`);
    console.log(`[v0] ${fieldName} failed pattern check`);
  }
  
  // Check length
  if (rule.minLength && value && value.length < rule.minLength) {
    errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
    console.log(`[v0] ${fieldName} failed minimum length check`);
  }
  
  if (rule.maxLength && value && value.length > rule.maxLength) {
    errors.push(`${fieldName} must not exceed ${rule.maxLength} characters`);
    console.log(`[v0] ${fieldName} failed maximum length check`);
  }
  
  return { valid: errors.length === 0, errors };
}
```

---

## Phase 4: Database & Backend Data Persistence

### 4.1 Database Schema Verification

```typescript
// Verify database schema matches expected fields
export async function verifyDatabaseSchema() {
  console.log('[v0] Verifying database schema...');
  
  const { data: schema, error } = await supabase
    .from('users')
    .select('*')
    .limit(0); // Just get column info
  
  if (error) {
    console.error('[v0] Schema check failed:', error);
    return false;
  }
  
  console.log('[v0] Database schema is valid');
  return true;
}
```

### 4.2 Data Transformation & Loss Debugging

```typescript
export async function createUserWithLogging(userData: UserData) {
  console.log('[v0] CREATE USER - Starting');
  console.log('[v0] Input Data:', JSON.stringify(userData, null, 2));
  
  try {
    // Before database insert
    console.log('[v0] Database insert starting with:', userData);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        password_hash: userData.passwordHash,
        full_name: userData.fullName,
        is_active: true,
        created_at: new Date().toISOString(),
      }])
      .select();
    
    if (error) {
      console.error('[v0] Database insert error:', error);
      console.error('[v0] Error code:', error.code);
      console.error('[v0] Error message:', error.message);
      throw error;
    }
    
    console.log('[v0] Database insert successful');
    console.log('[v0] Returned data:', JSON.stringify(data, null, 2));
    
    // Verify all fields were stored
    if (data && data[0]) {
      const storedUser = data[0];
      const expectedFields = ['id', 'email', 'password_hash', 'full_name'];
      const missingFields = expectedFields.filter(field => !(field in storedUser));
      
      if (missingFields.length > 0) {
        console.error('[v0] WARNING: Fields missing from stored data:', missingFields);
      } else {
        console.log('[v0] All expected fields stored successfully');
      }
    }
    
    return data?.[0];
  } catch (error) {
    console.error('[v0] CREATE USER - Failed:', error);
    throw error;
  }
}
```

### 4.3 RLS Policy Debugging

```typescript
// Debug Row Level Security policy issues
export async function debugRLSPolicy(tableName: string) {
  console.log(`[v0] Checking RLS policies for table: ${tableName}`);
  
  try {
    // Attempt insert to trigger RLS
    const { error } = await supabase
      .from(tableName)
      .insert([{ test: 'data' }])
      .select();
    
    if (error?.code === 'PGRST301') {
      console.error('[v0] RLS Policy blocked the request');
      console.error('[v0] Error details:', error);
      return { rlsBlocked: true, error };
    }
    
    console.log('[v0] RLS policies appear permissive');
    return { rlsBlocked: false };
  } catch (error) {
    console.error('[v0] RLS check error:', error);
    return { rlsBlocked: false, error };
  }
}
```

---

## Phase 5: Network & Request/Response Debugging

### 5.1 Network Request Inspector

```typescript
// Create a network debugging middleware
export async function debugNetworkRequest(url: string, options: RequestInit) {
  const startTime = Date.now();
  
  console.log('[v0] ===== NETWORK REQUEST START =====');
  console.log('[v0] URL:', url);
  console.log('[v0] Method:', options?.method || 'GET');
  console.log('[v0] Headers:', options?.headers);
  
  if (options?.body) {
    try {
      const bodyData = typeof options.body === 'string' 
        ? JSON.parse(options.body)
        : options.body;
      console.log('[v0] Request Body:', JSON.stringify(bodyData, null, 2));
      
      // Count fields
      if (typeof bodyData === 'object') {
        console.log('[v0] Body fields count:', Object.keys(bodyData).length);
        console.log('[v0] Body fields:', Object.keys(bodyData).join(', '));
      }
    } catch (e) {
      console.log('[v0] Request Body (raw):', options.body);
    }
  }
  
  try {
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    
    console.log('[v0] ===== NETWORK RESPONSE =====');
    console.log('[v0] Status:', response.status);
    console.log('[v0] Status Text:', response.statusText);
    console.log('[v0] Response Headers:', Object.fromEntries(response.headers));
    console.log('[v0] Duration:', duration + 'ms');
    
    // Clone response to read body
    const clonedResponse = response.clone();
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const responseData = await clonedResponse.json();
      console.log('[v0] Response Body:', JSON.stringify(responseData, null, 2));
      
      // Check for error messages
      if (responseData.errors) {
        console.error('[v0] Response contains errors:', responseData.errors);
      }
    } else {
      const responseText = await clonedResponse.text();
      console.log('[v0] Response Body:', responseText.substring(0, 500));
    }
    
    console.log('[v0] ===== REQUEST/RESPONSE END =====\n');
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[v0] ===== NETWORK ERROR =====');
    console.error('[v0] Error:', error);
    console.error('[v0] Duration:', duration + 'ms');
    console.error('[v0] ===== ERROR END =====\n');
    throw error;
  }
}
```

### 5.2 Response Completeness Check

```typescript
export async function checkResponseCompleteness(response: any, expectedFields: string[]) {
  console.log('[v0] Checking response completeness');
  console.log('[v0] Expected fields:', expectedFields);
  console.log('[v0] Response:', JSON.stringify(response, null, 2));
  
  const missingFields = expectedFields.filter(field => !(field in response));
  const extraFields = Object.keys(response).filter(field => !expectedFields.includes(field));
  
  if (missingFields.length > 0) {
    console.error('[v0] MISSING FIELDS:', missingFields);
  } else {
    console.log('[v0] All expected fields present');
  }
  
  if (extraFields.length > 0) {
    console.log('[v0] Extra fields in response:', extraFields);
  }
  
  return {
    complete: missingFields.length === 0,
    missingFields,
    extraFields,
  };
}
```

---

## Phase 6: Testing with Various Data Inputs

### 6.1 Test Cases & Scenarios

```typescript
const testCases = [
  {
    name: 'Valid data',
    data: {
      email: 'user@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      fullName: 'John Doe',
    },
    shouldSucceed: true,
  },
  {
    name: 'Extra whitespace',
    data: {
      email: '  user@example.com  ',
      password: '  SecurePass123!  ',
      confirmPassword: '  SecurePass123!  ',
      fullName: '  John Doe  ',
    },
    shouldSucceed: true,
  },
  {
    name: 'Missing fullName',
    data: {
      email: 'user@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      fullName: '',
    },
    shouldSucceed: false,
  },
  {
    name: 'Null values',
    data: {
      email: null,
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      fullName: 'John Doe',
    },
    shouldSucceed: false,
  },
];

export async function runAllTests() {
  console.log('[v0] ===== STARTING TEST SUITE =====\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    console.log(`[v0] TEST: ${test.name}`);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.data),
      });
      
      const result = await response.json();
      const isSuccess = response.ok;
      
      if (isSuccess === test.shouldSucceed) {
        console.log(`[v0] ✓ PASSED\n`);
        passed++;
      } else {
        console.log(`[v0] ✗ FAILED - Expected ${test.shouldSucceed ? 'success' : 'failure'}, got ${isSuccess}\n`);
        failed++;
      }
    } catch (error) {
      console.error(`[v0] ✗ ERROR: ${error}\n`);
      failed++;
    }
  }
  
  console.log(`[v0] ===== TEST RESULTS: ${passed} passed, ${failed} failed =====\n`);
}
```

---

## Phase 7: Solutions & Implementation

### 7.1 Form Validation Review Template

```typescript
// Complete form with synchronized validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registrationSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain special character'),
  confirmPassword: z.string(),
  fullName: z.string().trim().min(1, 'Full name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export function RegistrationForm() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
  });
  
  const formData = watch();
  
  const onSubmit = async (data) => {
    console.log('[v0] FORM SUBMISSION');
    console.log('[v0] Validated Data:', JSON.stringify(data, null, 2));
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      console.log('[v0] API Response:', result);
      
      if (!response.ok) {
        console.error('[v0] Registration failed:', result.errors || result.message);
        return;
      }
      
      console.log('[v0] Registration successful');
    } catch (error) {
      console.error('[v0] Submission error:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('email')} placeholder="Email" />
        {errors.email && <span>{errors.email.message}</span>}
      </div>
      <div>
        <input {...register('password')} type="password" placeholder="Password" />
        {errors.password && <span>{errors.password.message}</span>}
      </div>
      <div>
        <input {...register('confirmPassword')} type="password" placeholder="Confirm Password" />
        {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}
      </div>
      <div>
        <input {...register('fullName')} placeholder="Full Name" />
        {errors.fullName && <span>{errors.fullName.message}</span>}
      </div>
      <button type="submit">Register</button>
      {/* Debug info */}
      <pre style={{ fontSize: '10px', color: '#666' }}>
        {JSON.stringify(formData, null, 2)}
      </pre>
    </form>
  );
}
```

### 7.2 Server Validation Synchronization

```typescript
// Shared validation rules between frontend and backend
export const SHARED_VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Valid email is required',
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
    message: 'Password must be 8+ chars with uppercase, lowercase, number, and special character',
  },
  fullName: {
    minLength: 2,
    message: 'Full name is required',
  },
};

// Use in both frontend and backend
export function validateField(fieldName: string, value: string): { valid: boolean; error?: string } {
  const rule = SHARED_VALIDATION_RULES[fieldName];
  
  if (!rule) return { valid: true };
  
  // Trim value
  const trimmedValue = value.trim();
  
  // Check required
  if (!trimmedValue) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  // Check pattern (if exists)
  if (rule.pattern && !rule.pattern.test(trimmedValue)) {
    return { valid: false, error: rule.message };
  }
  
  // Check min length (if exists)
  if (rule.minLength && trimmedValue.length < rule.minLength) {
    return { valid: false, error: rule.message };
  }
  
  return { valid: true };
}
```

---

## Phase 8: Comprehensive Logging Strategy

### 8.1 Structured Logging Utility

```typescript
// lib/logging.ts
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  
  private createEntry(level: LogLevel, context: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
    };
  }
  
  debug(context: string, message: string, data?: any) {
    const entry = this.createEntry(LogLevel.DEBUG, context, message, data);
    this.logs.push(entry);
    console.log(`[v0] [${context}] ${message}`, data || '');
  }
  
  info(context: string, message: string, data?: any) {
    const entry = this.createEntry(LogLevel.INFO, context, message, data);
    this.logs.push(entry);
    console.log(`[v0] [${context}] ${message}`, data || '');
  }
  
  warn(context: string, message: string, data?: any) {
    const entry = this.createEntry(LogLevel.WARN, context, message, data);
    this.logs.push(entry);
    console.warn(`[v0] [${context}] ${message}`, data || '');
  }
  
  error(context: string, message: string, data?: any) {
    const entry = this.createEntry(LogLevel.ERROR, context, message, data);
    this.logs.push(entry);
    console.error(`[v0] [${context}] ${message}`, data || '');
  }
  
  getLogs(filter?: { level?: LogLevel; context?: string }): LogEntry[] {
    return this.logs.filter(log => {
      if (filter?.level && log.level !== filter.level) return false;
      if (filter?.context && log.context !== filter.context) return false;
      return true;
    });
  }
  
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
```

### 8.2 Form Submission Tracing

```typescript
export async function traceFormSubmission(formData: any, formName: string) {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('FORM_SUBMISSION', `Starting form submission: ${formName}`, { traceId });
  logger.debug('FORM_SUBMISSION', 'Form data received', { data: formData });
  
  // Step 1: Validate
  logger.info('VALIDATION', 'Starting validation');
  const validation = validateAllFields(formData);
  if (!validation.valid) {
    logger.error('VALIDATION', 'Validation failed', { errors: validation.errors });
    return { success: false, traceId };
  }
  logger.info('VALIDATION', 'Validation passed');
  
  // Step 2: Prepare
  logger.info('PREPARATION', 'Preparing data for submission');
  const cleanData = trimAndFormatData(formData);
  logger.debug('PREPARATION', 'Data prepared', { data: cleanData });
  
  // Step 3: Submit
  logger.info('SUBMISSION', 'Sending to API');
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanData),
    });
    
    logger.info('SUBMISSION', 'API response received', { status: response.status });
    
    const result = await response.json();
    
    if (response.ok) {
      logger.info('SUBMISSION', 'Submission successful', result);
      return { success: true, traceId, data: result };
    } else {
      logger.error('SUBMISSION', 'Submission failed', result);
      return { success: false, traceId, error: result };
    }
  } catch (error) {
    logger.error('SUBMISSION', 'Submission error', { error: error.message });
    return { success: false, traceId, error };
  }
}
```

---

## Quick Reference: Troubleshooting Checklist

- [ ] **Frontend Verification**
  - [ ] All form fields are visible and editable
  - [ ] User can input data in all required fields
  - [ ] Form submit button is clickable
  - [ ] No console errors when filling form
  - [ ] Network request shows all fields in payload

- [ ] **Client-Side Validation**
  - [ ] Validation errors are displayed correctly
  - [ ] Form can be submitted when all fields are filled
  - [ ] Whitespace is being trimmed
  - [ ] Field names match backend expectations

- [ ] **Server-Side Validation**
  - [ ] API logs show all fields in request body
  - [ ] Validation rules are not overly restrictive
  - [ ] Error messages are specific about missing fields
  - [ ] HTTP status codes are appropriate

- [ ] **Database**
  - [ ] All tables exist in database
  - [ ] Column names match what's being inserted
  - [ ] No RLS policies blocking inserts
  - [ ] Data is actually being stored

- [ ] **Network**
  - [ ] API request contains all fields
  - [ ] API response indicates success/failure correctly
  - [ ] Status codes match expected values
  - [ ] No network errors or timeouts

---

## Common Issues & Solutions Quick Reference

| Issue | Cause | Solution |
|-------|-------|----------|
| "Email required" when email is filled | Whitespace not trimmed | Use `.trim()` on string values |
| "Password required" but user typed it | Field name mismatch (password vs passwd) | Check field name mapping |
| "All fields required" on validation | Using `.required()` instead of checking emptiness | Use `.min(1)` for optional fields |
| Data lost in database | Column name mismatch (fullName vs full_name) | Verify schema and mapping |
| RLS policy errors | Missing service_role grants | Update RLS policies for service_role |
| Form submits empty data | Input not bound to form | Use proper form binding (React Hook Form) |

