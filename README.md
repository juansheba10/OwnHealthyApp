# OwnHealthyApp

Personal nutrition and training tracker. Brings together the weekly meal plan, recipe catalog, shopping list, weight and workout tracking, and an AI assistant that can read and modify the plan with user confirmation.

It's not a SaaS — there's no signup. The codebase is shared for reference. The app runs for 2 hand-provisioned users and is built around a specific routine (intermittent fasting protocol, CrossFit / Hyrox / football days, calorie targets per day type).

## What the app does

### Weekly meal plan

Each user has a 7-day plan. Each day declares its `day_type` — `training`, `rest`, `double`, or `football_only` — and that type drives which calorie target applies (targets live in `users.calorie_targets`, a jsonb keyed by day type).

Meals are edited per day: time, label (breakfast, lunch, dinner, snack…), name, ingredient list as plain text (e.g. `"150g brown rice"`), kcal and protein. The `meal_plans` table is `unique (user_id, date)` and gets overwritten when a day is regenerated.

### Recipe catalog

Recipes are **shared between both users** (anyone can read/add/edit). They have structured ingredients, tags, macros, instructions, and tag + text filters. Plan meals can link to a recipe via `recipe_id`.

### Auto-generated shopping list

Given a selection of days from the plan, `lib/utils/shopping.ts` parses the ingredient strings with regex, groups by `(name, unit)`, sums quantities, and assigns a category from a Spanish keyword map (`CATEGORY_MAP`). The result is a checkable list persisted in `shopping_lists`.

### Weight tracking

Daily or one-off entries. Chart view (Recharts) with comparison against the user's target.

### Workout tracking

Two separate tables:
- `workout_plans` — planned / upcoming sessions (what the user *is going to* do).
- `workout_logs` — completed sessions, with type (`crossfit | hyrox | football | running | other`), intensity, and perceived effort.

Weekly summary by workout type and volume.

### AI chat with tool-use and confirmation

The assistant (Claude Sonnet 4.6, `app/api/chat/route.ts`) gets user context injected on the first turn (profile, recent weight, workouts, today's plan) and has access to typed tools:

**Read — executed without asking:**
- `get_user_stats` — recent weight, workouts, adherence, fatigue.
- `analyze_progress` — diagnostic against goals.
- `get_training_schedule` — planned workout calendar (called before generating a plan).
- `list_recipes` — search the shared catalog.

**Write — pause the loop and ask the user for confirmation:**
- `update_meal` — replace a specific meal on a given day.
- `update_calorie_target` — adjust kcal target for a `day_type`.
- `add_recipe` — add a recipe to the catalog.
- `generate_weekly_plan` — generate 7 days respecting the workout calendar.

The client renders `ConfirmCard` with a summary of the action; the user approves or rejects, and the endpoint resumes the loop. Each approved write is recorded in `change_log` as an audit trail.

### Settings

Profile editing, calorie targets per day type, restrictions, fasting protocol, and data export.

## Data model

Schema in `supabase/migrations/`:

- `users` extends `auth.users` with `calorie_targets` (jsonb keyed by `day_type`), `restrictions`, and `fasting_protocol`.
- `meal_plans` — one row per `(user_id, date)`.
- `recipes` — shared between authenticated users.
- `weight_logs`, `workout_logs`, `meal_logs`, `chat_messages`, `shopping_lists` — restricted to `auth.uid() = user_id` via RLS.
- `workout_plans` — planned sessions (separate from `workout_logs`).
- `change_log` — audit trail for AI-driven writes.

## Security: two Supabase clients

There are **two clients and picking the wrong one is a security bug**:

- `lib/supabase/server.ts` and `lib/supabase/client.ts` — anon key + session cookie. **RLS applies.** Used everywhere user-facing.
- Admin client built with `SUPABASE_SERVICE_ROLE_KEY` — only in `lib/ai/tools.ts` and `app/api/chat/route.ts`. **Bypasses RLS.** Only used inside tools where `userId` is passed explicitly and trusted.

`middleware.ts` runs on every non-asset route, refreshes the session, and redirects unauthenticated users to `/login`. Everything under `app/(main)/*` assumes a valid session.

## Stack

- **Next.js 16.2** (App Router, React 19, Server Components, Server Actions)
- **Tailwind CSS v4** — dark theme, mobile-first
- **Supabase** — Postgres + Auth + Row Level Security
- **Anthropic SDK** — Claude Sonnet 4.6 with tool use
- **Recharts** — weight chart
- **Vercel** — hosting

## Local setup

```bash
npm install

cp .env.local.example .env.local
# Fill .env.local with Supabase and Anthropic keys

# Apply migrations in Supabase (SQL Editor or CLI), in order:
#   supabase/migrations/00001_initial_schema.sql
#   supabase/migrations/00002_workout_plans.sql
#   supabase/migrations/00003_recipes_ownership.sql
#   supabase/migrations/00004_shopping_lists_strict_owner.sql
#   supabase/migrations/00005_fasting_sessions.sql
#   supabase/migrations/00006_meal_logs_delete_policy.sql
#   supabase/migrations/00007_recipe_favorites.sql

# Create users in Supabase Auth, then seed initial data
cp supabase/seed.example.sql supabase/seed.sql
# Edit supabase/seed.sql (gitignored) with real UUIDs/data and run it

npm run dev   # http://localhost:3000
```

## Environment variables

| Variable | Description | Exposure |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key (RLS applies) | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role / secret key (bypasses RLS) | **Server only** |
| `ANTHROPIC_API_KEY` | Anthropic API key | **Server only** |
| `CHAT_STATE_SECRET` | HMAC secret for chat state tokens (32+ random bytes; `openssl rand -hex 32`) | **Server only** |

## Commands

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run lint      # ESLint (flat config)
npm run format    # Prettier
```

No test runner configured. The `@/*` alias resolves from the repo root.

## Layout

```
app/
  (auth)/login/         # Public login page
  (main)/               # Authenticated layout with Sidebar + BottomNav
    page.tsx            # Dashboard (today's meals, weight, workouts)
    plan/               # Weekly plan and per-day editor
    recipes/            # Shared catalog + filters
    shopping/           # Auto-generated shopping list
    track/
      weight/           # Weight + chart
      workouts/         # Logs and planning
    chat/               # AI chat with action confirmation
    settings/           # Profile, targets, export
  api/chat/route.ts     # Only API route (tool-use loop)
components/
  ui/                   # Sidebar, BottomNav
  plan/                 # DayCard, MealBlock, MacrosBar
  tracking/             # WeightChart
  chat/                 # ChatMessage, ChatInput, ConfirmCard
lib/
  supabase/             # Browser, server, and middleware clients
  ai/                   # Tool definitions, execution, state token
  utils/                # Dates, shopping aggregation
  types.ts              # Shared types (DayType, Macros, etc.)
supabase/
  migrations/           # Versioned schema SQL
  seed.example.sql      # Template (real seed.sql is local / gitignored)
```
