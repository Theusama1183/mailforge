# MailForge Developer Guide

## Table of Contents

- [Adding a New API Route](#adding-a-new-api-route)
- [Adding a Database Migration](#adding-a-database-migration)
- [Creating a New Page](#creating-a-new-page)
- [Creating a New Component](#creating-a-new-component)
- [Testing](#testing)
- [Code Style Guidelines](#code-style-guidelines)

---

## Adding a New API Route

All API routes live under `src/app/api/`. Each route is a `route.ts` file exporting HTTP method handlers.

**1. Create the route file:**

```
src/app/api/my-feature/route.ts
```

For dynamic segments:
```
src/app/api/my-feature/[id]/route.ts
```

**2. Follow the standard pattern:**

```typescript
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspace_id")

    if (!workspaceId) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Your logic here
    const { data, error } = await supabase
      .from("your_table")
      .select("*")
      .eq("workspace_id", workspaceId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

**Key conventions:**
- Always check authentication via `supabase.auth.getUser()`
- Workspace-scoped routes verify membership in `workspace_members`
- Return `{ error: "..." }` with appropriate HTTP status on failure
- Use `try/catch` around all Supabase calls
- For public routes (no auth), make sure to add the path prefix to the middleware allowlist in `src/lib/supabase/middleware.ts`

**3. Available Supabase clients:**

| Client | Import | Use Case |
|--------|--------|----------|
| Server (cookies) | `@/lib/supabase/server` | API routes, Server Components, Server Actions |
| API client | `@/lib/supabase/api-client` | API routes (returns `{ user, supabase }` tuple) |
| Browser | `@/lib/supabase/client` | Client Components, hooks |
| Admin | `@/lib/supabase/admin` | Service-role operations (bypasses RLS) |

---

## Adding a Database Migration

Migrations live in `supabase/migrations/` and are numbered sequentially.

**1. Create a new migration file:**

```
supabase/migrations/0033_my_feature.sql
```

Use the next available number. Check existing files to determine the sequence.

**2. Write the migration:**

```sql
-- Add your table, column, or policy changes
CREATE TABLE IF NOT EXISTS my_feature (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE my_feature ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view own workspace features"
  ON my_feature FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert in own workspace"
  ON my_feature FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Add indexes
CREATE INDEX idx_my_feature_workspace ON my_feature(workspace_id);
```

**3. Apply the migration:**

```bash
# Local (via Supabase CLI)
npx supabase db push

# Remote (via script)
node scripts/apply-latest-migrations.js
```

**Migration naming convention:** `NNNN_description.sql` where `NNNN` is zero-padded sequential number.

**Tips:**
- Always use `IF NOT EXISTS` / `IF EXISTS` for safety
- Always enable RLS and add policies
- Reference `auth.uid()` in RLS policies for user-level access control
- Add indexes for columns used in WHERE clauses
- Use `ON DELETE CASCADE` for foreign keys where appropriate

---

## Creating a New Page

Pages live under `src/app/` following Next.js App Router conventions.

### Public Page

```
src/app/my-page/page.tsx
```

```tsx
export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
    </div>
  )
}
```

### Dashboard Page (Authenticated)

Dashboard pages go inside the `(dashboard)` route group and are scoped under a workspace:

```
src/app/(dashboard)/[workspaceId]/my-feature/page.tsx
```

```tsx
import { PageHeader } from "@/components/page-header"

export default function MyFeaturePage() {
  return (
    <div>
      <PageHeader title="My Feature" description="Description here" />
      {/* Your page content */}
    </div>
  )
}
```

### Adding a Loading State

Create a `loading.tsx` alongside your page:

```
src/app/(dashboard)/[workspaceId]/my-feature/loading.tsx
```

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

### Adding an Error Boundary

Create an `error.tsx` alongside your page:

```
src/app/(dashboard)/[workspaceId]/my-feature/error.tsx
```

```tsx
"use client"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 text-center">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Navigation

Add links in the sidebar component at `src/components/inbox/sidebar.tsx` for dashboard navigation.

---

## Creating a New Component

Components live in `src/components/`. Follow these conventions:

### Component Location

| Type | Directory |
|------|-----------|
| Base UI primitives | `src/components/ui/` |
| Inbox-specific | `src/components/inbox/` |
| Compose-specific | `src/components/compose/` |
| Email builder blocks | `src/components/email-builder/blocks/` |
| Shared/workspace | `src/components/` |

### Component Pattern

```tsx
import { cn } from "@/lib/utils"

interface MyComponentProps {
  title: string
  className?: string
}

export function MyComponent({ title, className }: MyComponentProps) {
  return (
    <div className={cn("base-classes", className)}>
      <h2>{title}</h2>
    </div>
  )
}
```

**Conventions:**
- Use named exports (not default exports) for components
- Accept a `className` prop and merge with `cn()` (uses `tailwind-merge` + `clsx`)
- Use TypeScript interfaces for props
- Keep components focused — one component per file
- Place test files in `__tests__/` alongside the component

### Using Existing UI Components

Import from `@/components/ui/`:

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
```

### State Management

- **Local state**: Use `useState` / `useReducer`
- **Global state**: Use Zustand stores
- **Server state**: Use Supabase realtime subscriptions or fetch in Server Components

---

## Testing

### Unit & Component Tests (Jest)

Tests live in `__tests__/` directories alongside the code they test:

```
src/lib/__tests__/retry.test.ts
src/components/__tests__/page-header.test.tsx
src/components/ui/__tests__/button.test.tsx
```

**Run tests:**
```bash
npx jest                  # All tests
npx jest --watch          # Watch mode
npx jest path/to/file.ts  # Single file
```

**Test pattern:**

```typescript
import { render, screen } from "@testing-library/react"
import { MyComponent } from "../my-component"

describe("MyComponent", () => {
  it("renders the title", () => {
    render(<MyComponent title="Hello" />)
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })
})
```

**Mocking:**
- `next/navigation` is auto-mocked (see `__mocks__/`)
- `next/dynamic` is auto-mocked
- Add new mocks in `__mocks__/` at the project root

### E2E Tests (Playwright)

Tests live in `e2e/`:

```
e2e/login-flow.spec.ts
e2e/navigation.spec.ts
e2e/api-health.spec.ts
```

**Run tests:**
```bash
npx playwright test              # All E2E tests
npx playwright test e2e/login    # Specific file
npx playwright test --ui         # Interactive mode
```

The dev server starts automatically (configured in `playwright.config.ts`).

**Test pattern:**

```typescript
import { test, expect } from "@playwright/test"

test("homepage loads", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/MailForge/)
})
```

---

## Code Style Guidelines

### TypeScript

- Strict mode enabled
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `Record<string, unknown>` instead of `{ [key: string]: any }`
- Avoid `any` — use `unknown` and narrow with type guards

### Formatting

- **Tailwind CSS v4** with PostCSS
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Class order: layout → spacing → typography → visual → state
- Mobile-first responsive design

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `EmailViewer` |
| Files (components) | kebab-case | `email-viewer.tsx` |
| Files (utilities) | kebab-case | `email-utils.ts` |
| API routes | kebab-case directories | `api/email-queue/` |
| Database tables | snake_case | `email_queue` |
| Environment variables | SCREAMING_SNAKE_CASE | `SUPABASE_SERVICE_ROLE_KEY` |
| React hooks | `use` prefix | `useEmailSearch` |

### Imports

Use the `@/` path alias (maps to `src/`):

```typescript
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

Order: external packages → `@/` aliases → relative imports.

### API Routes

- Export named functions matching HTTP methods: `GET`, `POST`, `PATCH`, `DELETE`
- Validate required params early and return `400` with a clear error message
- Use Supabase RLS for authorization (preferred) or check `workspace_members` membership
- Wrap all logic in `try/catch`
- Log errors with `console.error()` for debugging
- Return consistent error shape: `{ error: "message" }`

### Database

- Always enable RLS on new tables
- Use foreign keys with `ON DELETE CASCADE` where appropriate
- Index columns used in `WHERE` and `JOIN` clauses
- Use `gen_random_uuid()` as default for primary keys
- Use `NOW()` / `DEFAULT NOW()` for timestamps
