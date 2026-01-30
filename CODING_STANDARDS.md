# Comprehensive Coding Standards & Best Practices

This document outlines the coding standards and best practices for this Next.js + Prisma/Postgres codebase. These rules are enforced through `.cursorrules` and should be followed by all developers.

---

## 📋 Table of Contents

1. [Function Rules](#function-rules)
2. [Class Rules](#class-rules)
3. [Module/File Rules](#modulefile-rules)
4. [Next.js Specific Rules](#nextjs-specific-rules)
5. [Prisma/Database Rules](#prismadatabase-rules)
6. [Clean Code Rules](#clean-code-rules)
7. [Reusability Rules](#reusability-rules)
8. [Error Handling Rules](#error-handling-rules)
9. [Type Safety Rules](#type-safety-rules)
10. [Testing & Documentation Rules](#testing--documentation-rules)
11. [Code Structure & Readability Rules](#code-structure--readability-rules)
12. [Security Rules](#security-rules)
13. [Performance Rules](#performance-rules)

---

## 🎯 Function Rules

### Size & Complexity
- **Maximum 25 lines per function** - Keep functions small and focused
- **Maximum 5 parameters** - Use objects for multiple parameters
- **Maximum 3 levels of nesting** - Avoid deeply nested conditionals

### Documentation
- **All functions must have docstrings** - Document purpose, parameters, and return values
- **Document complex logic** - Explain non-obvious algorithms or business rules

### Naming & Style
- **Use camelCase** for function names (e.g., `getUserById`, `calculateTotal`)
- **Use descriptive names** - Function names should clearly indicate their purpose
- **Prefer pure functions** - Minimize side effects when possible

### Best Practices
- **No unused parameters** - Remove or use all declared parameters
- **Avoid deep nesting** - Refactor complex conditionals into helper functions

**Example:**
```typescript
/**
 * Calculates the total price including tax
 * @param items - Array of items with price property
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @returns Total price with tax applied
 */
function calculateTotalWithTax(items: Item[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 + taxRate);
}
```

---

## 🏛️ Class Rules

### Size & Structure
- **Maximum 100 lines per class** - Keep classes focused
- **Maximum 10 methods per class** - Follow Single Responsibility Principle
- **Maximum 10 attributes per class** - Avoid bloated classes

### Documentation
- **All classes must have docstrings** - Document purpose and usage

### Naming & Organization
- **Use PascalCase** for class names (e.g., `UserService`, `OrderRepository`)
- **One class per file** - File name should match class name
- **Follow Single Responsibility Principle** - Each class should have one reason to change

**Example:**
```typescript
/**
 * Service for managing user authentication
 */
class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async authenticate(email: string, password: string): Promise<User> {
    // Implementation
  }
}
```

---

## 📁 Module/File Rules

### Size & Organization
- **Maximum 300 lines per file** - Split large files into smaller modules
- **Single responsibility per file** - Each file should have one clear purpose

### Naming
- **Use kebab-case** for file names (e.g., `user-service.ts`, `order-repository.ts`)
- **Component files match component name** - React components should match file name

### Imports & Exports
- **Explicit imports only** - No wildcard imports (`import * as`)
- **Prefer named exports** - Use named exports over default exports when possible
- **No global variables** - Avoid polluting global scope

**Example:**
```typescript
// ✅ Good
import { getUserById, createUser } from '@/lib/user-service';
export { UserService } from './user-service';

// ❌ Bad
import * as UserService from '@/lib/user-service';
export default UserService;
```

---

## ⚛️ Next.js Specific Rules

### API Routes
- **Maximum 50 lines per route handler** - Extract logic to service functions
- **Always validate input** - Use Zod or similar for request validation
- **Handle errors properly** - Return appropriate HTTP status codes
- **Use Prisma transactions** - For multiple database operations

**Example:**
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/lib/user-service';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createUserSchema.parse(body);
    const user = await createUser(data);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### React Components
- **Maximum 150 lines per component** - Extract logic to custom hooks
- **Use PascalCase** for component names (e.g., `UserProfile`, `OrderList`)
- **Prefer functional components** - Use hooks instead of class components
- **Avoid prop drilling** - Use context or state management for deep props
- **Extract logic to custom hooks** - Keep components focused on rendering

**Example:**
```typescript
// components/UserProfile.tsx
import { useUser } from '@/hooks/useUser';

interface UserProfileProps {
  userId: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const { user, isLoading, error } = useUser(userId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Server Components & Server Actions
- **Prefer server components** - Use server components when possible for better performance
- **Type all server actions** - Use TypeScript for type safety
- **Validate input in server actions** - Always validate user input

---

## 🗄️ Prisma/Database Rules

### Schema Design
- **Document all models** - Add comments to explain model purpose
- **Use meaningful relation names** - Clear relation names improve readability
- **Prefer explicit foreign keys** - Make relationships clear in schema
- **Avoid cascading deletes unless needed** - Be explicit about data deletion

**Example:**
```prisma
// schema.prisma
/// User account information
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  
  /// Orders placed by this user
  orders    Order[]
  
  @@map("users")
}
```

### Database Queries
- **Use indexes appropriately** - Add indexes for frequently queried fields
- **Avoid N+1 queries** - Use `include` or `select` to fetch related data
- **Use transactions for multiple operations** - Ensure data consistency
- **Type all queries** - Use Prisma's generated types
- **Prefer Prisma Client over raw SQL** - Use Prisma's type-safe queries
- **Handle database errors explicitly** - Catch and handle Prisma errors

**Example:**
```typescript
// ✅ Good - Single query with include
const userWithOrders = await prisma.user.findUnique({
  where: { id: userId },
  include: { orders: true },
});

// ❌ Bad - N+1 query
const user = await prisma.user.findUnique({ where: { id: userId } });
const orders = await prisma.order.findMany({ where: { userId: user.id } });

// ✅ Good - Transaction
await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  prisma.user.update({ where: { id: userId }, data: { orderCount: { increment: 1 } } }),
]);
```

---

## 🧹 Clean Code Rules

### Formatting
- **2-space indentation** - Consistent indentation throughout
- **Maximum 100 characters per line** - Improve readability
- **Consistent brace and spacing style** - Follow project style guide

### Code Quality
- **No magic numbers** - Use named constants
- **No hardcoded strings** - Use constants or configuration
- **Clear variable names** - Self-documenting code
- **No redundant code** - Avoid copy-paste, extract to functions
- **Prefer `const` over `let`** - Immutable by default
- **Use destructuring** - When appropriate for cleaner code

**Example:**
```typescript
// ❌ Bad - Magic numbers and hardcoded strings
if (user.age > 18 && user.status === "active") {
  return "Welcome";
}

// ✅ Good - Named constants
const MINIMUM_AGE = 18;
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

if (user.age > MINIMUM_AGE && user.status === USER_STATUS.ACTIVE) {
  return MESSAGES.WELCOME;
}
```

---

## ♻️ Reusability Rules

### Code Organization
- **Create helper functions** - Extract common logic
- **Make functions generic** - Avoid hardcoded values
- **Create shared utilities** - Reusable across the codebase
- **Extract common patterns** - DRY (Don't Repeat Yourself)
- **Avoid duplicate logic** - Refactor when you see repetition

**Example:**
```typescript
// ✅ Good - Reusable utility
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Used throughout the app
formatCurrency(100); // "$100.00"
formatCurrency(50, 'EUR'); // "€50.00"
```

---

## ⚠️ Error Handling Rules

### Best Practices
- **Always handle exceptions** - Never let errors bubble up unhandled
- **No silent failures** - Log or surface errors appropriately
- **Use specific exceptions** - Avoid generic `catch (error)`
- **Log errors when possible** - Help with debugging
- **Provide meaningful error messages** - Help users understand issues
- **Use error boundaries in React** - Catch component errors gracefully

**Example:**
```typescript
// ✅ Good - Specific error handling
try {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
} catch (error) {
  if (error instanceof NotFoundError) {
    logger.warn(`User not found: ${userId}`);
    throw error;
  }
  logger.error('Unexpected error fetching user', error);
  throw new InternalServerError('Failed to fetch user');
}
```

---

## 🔒 Type Safety Rules

### TypeScript Best Practices
- **Type annotations required** - Explicit types for all functions
- **Prefer TypeScript over JavaScript** - Use `.ts` and `.tsx` files
- **Avoid `any` type** - Use `unknown` or proper types
- **Use strict null checks** - Handle null/undefined explicitly
- **Define interfaces for shared types** - Reusable type definitions

**Example:**
```typescript
// ✅ Good - Explicit types
interface User {
  id: string;
  email: string;
  name: string | null;
}

async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// ❌ Bad - Using any
function getUserById(id: any): any {
  return prisma.user.findUnique({ where: { id } });
}
```

---

## 🧪 Testing & Documentation Rules

### Testing
- **Encourage unit tests** - Test individual functions and components
- **Test naming convention** - Use `test_*` or `describe_*` patterns
- **Test API routes** - Ensure endpoints work correctly
- **Test database operations** - Verify data integrity

**Example:**
```typescript
// __tests__/user-service.test.ts
import { describe, it, expect } from 'vitest';
import { getUserById } from '@/lib/user-service';

describe('getUserById', () => {
  it('should return user when found', async () => {
    const user = await getUserById('user-123');
    expect(user).toBeDefined();
    expect(user?.id).toBe('user-123');
  });

  it('should return null when user not found', async () => {
    const user = await getUserById('non-existent');
    expect(user).toBeNull();
  });
});
```

### Documentation
- **Docstrings for all public APIs** - Document exported functions and classes
- **Document complex logic** - Explain non-obvious algorithms

---

## 📐 Code Structure & Readability Rules

### Organization
- **Logical grouping of code** - Group related functions together
- **Separate concerns into modules** - One responsibility per module
- **Organize imports logically** - Group by source (external, internal, relative)
- **Group related functions together** - Keep related code close

### Design Patterns
- **Prefer composition over inheritance** - More flexible and maintainable
- **Prefer immutable data** - Avoid mutations when possible
- **Avoid long parameter lists** - Use objects for multiple parameters

**Example:**
```typescript
// ❌ Bad - Long parameter list
function createUser(name: string, email: string, age: number, city: string, country: string) {
  // ...
}

// ✅ Good - Object parameter
interface CreateUserInput {
  name: string;
  email: string;
  age: number;
  city: string;
  country: string;
}

function createUser(input: CreateUserInput) {
  // ...
}
```

---

## 🔐 Security Rules

### Input Validation
- **Validate all user input** - Never trust client-side data
- **Sanitize database inputs** - Prevent injection attacks
- **Use parameterized queries** - Prisma handles this, but be aware
- **Protect API routes with authentication** - Secure sensitive endpoints
- **Handle sensitive data securely** - Never log passwords or tokens

**Example:**
```typescript
// ✅ Good - Input validation
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = createUserSchema.parse(body); // Throws if invalid
  // Safe to use validatedData
}
```

---

## ⚡ Performance Rules

### Database Optimization
- **Optimize database queries** - Use indexes, avoid N+1 queries
- **Use pagination for large datasets** - Don't fetch everything at once
- **Implement caching where appropriate** - Reduce database load

### React Optimization
- **Avoid unnecessary re-renders** - Use React.memo, useMemo, useCallback
- **Lazy load components when possible** - Code splitting for better performance

**Example:**
```typescript
// ✅ Good - Optimized component
import { memo, useMemo } from 'react';

interface UserListProps {
  users: User[];
  filter: string;
}

export const UserList = memo(function UserList({ users, filter }: UserListProps) {
  const filteredUsers = useMemo(() => {
    return users.filter(user => user.name.includes(filter));
  }, [users, filter]);

  return (
    <ul>
      {filteredUsers.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
});
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Best Practices](https://react.dev/learn)

---

## 🤝 Contributing

When contributing to this codebase, please ensure all code follows these standards. The `.cursorrules` file will help enforce these rules automatically in your IDE.

**Remember:** Code is read more often than it's written. Write code that your future self (and teammates) will thank you for!
