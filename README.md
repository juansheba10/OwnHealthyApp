# NutriTrack

Webapp privada de nutrición y entrenamiento para 2 usuarios pre-creados. Une el plan semanal de comidas, el catálogo de recetas, la lista de compra, el tracking de peso y entrenos, y un asistente de IA que puede leer y modificar el plan bajo confirmación del usuario.

No es un producto público: las cuentas se crean a mano en Supabase y la app está diseñada alrededor de una rutina concreta (protocolo de ayuno, días de CrossFit / Hyrox / fútbol, objetivos calóricos por tipo de día).

## Qué hace la app

### Plan semanal de comidas

Cada usuario tiene un plan de 7 días. Cada día declara su `day_type` — `training`, `rest`, `double` o `football_only` — y ese tipo determina el objetivo calórico que aplica (los objetivos viven en `users.calorie_targets`, un jsonb por tipo de día).

Las comidas se editan por día: hora, etiqueta (desayuno, comida, cena, snack…), nombre, lista de ingredientes en texto plano (ej. `"150g arroz integral"`), kcal y proteína. La tabla `meal_plans` es `unique (user_id, date)` y se sobrescribe al regenerar un día.

### Catálogo de recetas

Las recetas son **compartidas entre los dos usuarios** (cualquiera lee/añade/edita). Tienen ingredientes estructurados, tags, macros, instrucciones y filtros por tag + búsqueda de texto. Las comidas del plan pueden enlazar a una receta vía `recipe_id`.

### Lista de compra autogenerada

A partir de los días seleccionados del plan, `lib/utils/shopping.ts` parsea las cadenas de ingredientes con regex, agrupa por `(nombre, unidad)`, suma cantidades y asigna categoría según un mapa de palabras clave en español (`CATEGORY_MAP`). El resultado es una lista marcable que se persiste en `shopping_lists`.

### Tracking de peso

Registro diario o puntual. Vista con gráfica de evolución (Recharts) y comparación contra el objetivo del usuario.

### Tracking de entrenamientos

Dos tablas separadas:
- `workout_plans` — sesiones planificadas / próximas (lo que el usuario *va* a hacer).
- `workout_logs` — sesiones completadas, con tipo (`crossfit | hyrox | football | running | other`), intensidad e intensidad percibida.

Resumen semanal por tipo de entreno y volumen.

### Chat IA con tool-use y confirmación

El asistente (Claude Sonnet 4.6, `app/api/chat/route.ts`) tiene contexto del usuario inyectado en el primer turno (perfil, peso reciente, entrenos, plan de hoy) y acceso a tools tipadas:

**Lectura — se ejecutan sin pedir permiso:**
- `get_user_stats` — peso reciente, entrenos, adherencia, fatiga.
- `analyze_progress` — diagnóstico contra objetivos.
- `get_training_schedule` — calendario de entrenos planificados (se invoca antes de generar plan).
- `list_recipes` — busca en el catálogo compartido.

**Escritura — pausan el loop y piden confirmación al usuario:**
- `update_meal` — sustituye una comida concreta de un día.
- `update_calorie_target` — ajusta kcal objetivo para un `day_type`.
- `add_recipe` — añade receta al catálogo.
- `generate_weekly_plan` — genera 7 días respetando el calendario de entrenos.

El cliente renderiza `ConfirmCard` con el resumen de la acción; el usuario aprueba o rechaza, y el endpoint reanuda el loop. Cada escritura aprobada queda registrada en `change_log` como auditoría.

### Ajustes

Edición de perfil, objetivos calóricos por tipo de día, restricciones, protocolo de ayuno y exportación de datos.

## Modelo de datos

Schema en `supabase/migrations/`:

- `users` extiende `auth.users` con `calorie_targets` (jsonb por `day_type`), `restrictions` y `fasting_protocol`.
- `meal_plans` — un registro por `(user_id, date)`.
- `recipes` — compartidas entre usuarios autenticados.
- `weight_logs`, `workout_logs`, `meal_logs`, `chat_messages`, `shopping_lists` — restringidos a `auth.uid() = user_id` por RLS.
- `workout_plans` — sesiones planificadas (separado de `workout_logs`).
- `change_log` — audit trail de las escrituras hechas por la IA.

## Seguridad: dos clientes Supabase

Hay **dos clientes y elegir mal es un fallo de seguridad**:

- `lib/supabase/server.ts` y `lib/supabase/client.ts` — anon key + cookie de sesión. **RLS aplica.** Es lo que usa toda la app de cara al usuario.
- Cliente admin con `SUPABASE_SERVICE_ROLE_KEY` — solo en `lib/ai/tools.ts` y `app/api/chat/route.ts`. **Bypassa RLS.** Solo se usa dentro de tools donde `userId` se pasa explícito.

`middleware.ts` corre en todas las rutas no-asset, refresca la sesión y redirige no-autenticados a `/login`. Todo `app/(main)/*` asume sesión válida.

## Stack

- **Next.js 16.2** (App Router, React 19, Server Components, Server Actions)
- **Tailwind CSS v4** — tema oscuro, mobile-first
- **Supabase** — Postgres + Auth + Row Level Security
- **Anthropic SDK** — Claude Sonnet 4.6 con tool use
- **Recharts** — gráfica de peso
- **Vercel** — hosting

## Setup local

```bash
npm install

cp .env.local.example .env.local
# Rellenar .env.local con claves de Supabase y Anthropic

# Aplicar migraciones en Supabase (SQL Editor o CLI)
#   supabase/migrations/00001_initial_schema.sql
#   supabase/migrations/00002_workout_plans.sql

# Crear usuarios en Supabase Auth y luego seedear datos iniciales
cp supabase/seed.example.sql supabase/seed.sql
# Editar supabase/seed.sql (gitignored) con UUIDs/datos reales y ejecutar

npm run dev   # http://localhost:3000
```

## Variables de entorno

| Variable | Descripción | Exposición |
|----------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (RLS aplica) | Pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (bypassa RLS) | **Solo servidor** |
| `ANTHROPIC_API_KEY` | API key de Anthropic | **Solo servidor** |

## Comandos

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción
npm run lint      # ESLint (flat config)
npm run format    # Prettier
```

No hay test runner configurado. El alias `@/*` apunta a la raíz del repo.

## Estructura

```
app/
  (auth)/login/         # Login público
  (main)/               # Layout autenticado con Sidebar + BottomNav
    page.tsx            # Dashboard (comidas de hoy, peso, entrenos)
    plan/               # Plan semanal y editor por día
    recipes/            # Catálogo compartido + filtros
    shopping/           # Lista de compra autogenerada
    track/
      weight/           # Peso + gráfica
      workouts/         # Logs y planificación
    chat/               # Chat IA con confirmación de acciones
    settings/           # Perfil, objetivos, exportación
  api/chat/route.ts     # Único endpoint API (loop de tool use)
components/
  ui/                   # Sidebar, BottomNav
  plan/                 # DayCard, MealBlock, MacrosBar
  tracking/             # WeightChart
  chat/                 # ChatMessage, ChatInput, ConfirmCard
lib/
  supabase/             # Clientes browser, server, middleware
  ai/                   # Tool definitions, ejecución, state token
  utils/                # Fechas, shopping aggregation
  types.ts              # Tipos compartidos (DayType, Macros, etc.)
supabase/
  migrations/           # Schema SQL versionado
  seed.example.sql      # Plantilla (seed.sql real es local/gitignored)
```
