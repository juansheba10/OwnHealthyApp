# NutriTrack

Webapp privada para gestionar plan nutricional, lista de compra y tracking de salud para 2 usuarios.

## Stack

- **Next.js 15** (App Router, TypeScript, Server Components)
- **Tailwind CSS v4** (dark theme, mobile-first)
- **Supabase** (PostgreSQL, Auth, Row Level Security)
- **Recharts** (weight evolution charts)
- **Anthropic SDK** (AI chat assistant with tool use)
- **Vercel** (hosting)

## Features

- Login con email y password (2 usuarios pre-creados)
- Dashboard con comidas del dia, peso y entrenamientos
- Plan de comidas semanal con editor por dia
- Catalogo de recetas con filtros por tags y busqueda
- Lista de compra autogenerada desde el plan
- Tracking de peso con grafica de evolucion
- Tracking de entrenamientos con formulario y resumen semanal
- Chat IA conectado a la base de datos del usuario
- Ajustes de perfil, objetivos y exportacion de datos

## Setup local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus claves de Supabase y Anthropic

# Ejecutar migracion en Supabase (SQL Editor o CLI)
# supabase/migrations/00001_initial_schema.sql

# Crear usuarios en Supabase Auth y ejecutar seed
# supabase/seed.sql

# Desarrollo
npm run dev
```

## Variables de entorno

| Variable | Descripcion | Exposicion |
|----------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Publica |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anonima de Supabase | Publica |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (bypasses RLS) | Solo servidor |
| `ANTHROPIC_API_KEY` | API key de Anthropic | Solo servidor |

## Comandos

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de produccion
npm run lint      # ESLint
npm run format    # Prettier
```

## Estructura

```
app/
  (auth)/login/       # Login page
  (main)/             # Layout con navegacion
    page.tsx          # Dashboard
    plan/             # Plan semanal + editor de dia
    recipes/          # Catalogo de recetas
    shopping/         # Lista de compra
    track/            # Hub de tracking
      weight/         # Peso
      workouts/       # Entrenamientos
    chat/             # Chat IA
    settings/         # Ajustes
  api/chat/           # Endpoint del chat IA
components/
  ui/                 # BottomNav, Sidebar
  plan/               # DayCard, MealBlock, MacrosBar
  tracking/           # WeightChart
  chat/               # ChatMessage, ChatInput
lib/
  supabase/           # Cliente browser, server, middleware
  ai/                 # Tool definitions y ejecucion
  utils/              # Fechas, shopping aggregation
  types.ts            # Tipos compartidos
supabase/
  migrations/         # SQL schema
  seed.sql            # Datos iniciales
```
