-- NutriTrack · Seed data (example)
--
-- This is a sanitized template. Copy to seed.sql and fill in real values:
--
--   cp supabase/seed.example.sql supabase/seed.sql
--
-- The real seed.sql is gitignored.
--
-- Steps before running:
-- 1. Create both users via Supabase Auth (email + password) in the dashboard.
-- 2. Copy their auth.users.id values and replace USER_1_UUID / USER_2_UUID below.
-- 3. Adjust profile, calorie_targets, restrictions, and meal_plans to match the
--    real users. Do NOT commit the filled-in seed.sql.

-- ============================================
-- USER PROFILES
-- ============================================

insert into public.users (id, email, name, profile, calorie_targets, protein_target, restrictions, fasting_protocol)
values
  (
    'USER_1_UUID',
    'user1@example.com',
    'User 1',
    '{"edad": 30, "altura": 180, "peso": 80, "sexo": "M", "nivel_actividad": "alto"}',
    '{"training": 2500, "rest": 2000, "double": 2800, "football_only": 2400}',
    180,
    array['sin_pescado'],
    '16:8'
  ),
  (
    'USER_2_UUID',
    'user2@example.com',
    'User 2',
    '{"edad": 28, "altura": 165, "peso": 60, "sexo": "F", "nivel_actividad": "moderado"}',
    '{"training": 1900, "rest": 1700, "double": 2000, "football_only": 1800}',
    100,
    array[]::text[],
    null
  );

-- ============================================
-- RECIPES
-- ============================================
-- The recipe catalog below is generic and safe to keep as-is.
-- Add or remove recipes as needed for your setup.

insert into public.recipes (title, subtitle, tags, ingredients, steps, macros, servings, prep_time_min, pairing_notes)
values
  (
    'Bowl de pollo y arroz',
    'Pechuga a la plancha con arroz integral y verduras salteadas',
    array['protein', 'warm', 'meal_prep'],
    '[{"name": "pechuga de pollo", "qty": 200, "unit": "g"}, {"name": "arroz integral", "qty": 150, "unit": "g"}, {"name": "brócoli", "qty": 100, "unit": "g"}, {"name": "aceite de oliva", "qty": 10, "unit": "ml"}, {"name": "salsa de soja", "qty": 15, "unit": "ml"}]',
    '1. Cocinar arroz. 2. Salpimentar y grillar pechuga 6 min/lado. 3. Saltear brócoli con ajo. 4. Montar bowl y aliñar con soja.',
    '{"kcal": 620, "protein": 52, "carbs": 58, "fat": 16}',
    1, 25,
    'Base perfecta para día de entreno.'
  ),
  (
    'Tortilla francesa proteica',
    '4 claras + 1 huevo entero con jamón y queso',
    array['protein', 'quick', 'warm'],
    '[{"name": "claras de huevo", "qty": 4, "unit": "unidades"}, {"name": "huevo entero", "qty": 1, "unit": "unidad"}, {"name": "jamón serrano", "qty": 30, "unit": "g"}, {"name": "queso bajo en grasa", "qty": 20, "unit": "g"}]',
    '1. Batir claras y huevo. 2. Verter en sartén antiadherente. 3. Añadir jamón y queso rallado. 4. Doblar y servir.',
    '{"kcal": 280, "protein": 38, "carbs": 2, "fat": 13}',
    1, 8,
    'Ideal para romper ayuno con algo rápido y alto en proteína.'
  ),
  (
    'Yogur griego con frutos secos',
    'Yogur proteico con nueces, arándanos y canela',
    array['protein', 'quick', 'fresh', 'snack'],
    '[{"name": "yogur griego 0%", "qty": 200, "unit": "g"}, {"name": "nueces", "qty": 20, "unit": "g"}, {"name": "arándanos", "qty": 50, "unit": "g"}, {"name": "canela", "qty": 2, "unit": "g"}, {"name": "miel", "qty": 10, "unit": "g", "optional": true}]',
    '1. Poner yogur en bowl. 2. Añadir nueces troceadas y arándanos. 3. Espolvorear canela. 4. Opcional: hilo de miel.',
    '{"kcal": 290, "protein": 22, "carbs": 20, "fat": 14}',
    1, 3,
    'Snack perfecto o parte de desayuno.'
  ),
  (
    'Pasta con carne picada y tomate',
    'Penne con boloñesa casera rápida',
    array['warm', 'meal_prep', 'protein'],
    '[{"name": "pasta penne", "qty": 100, "unit": "g"}, {"name": "carne picada magra", "qty": 150, "unit": "g"}, {"name": "tomate triturado", "qty": 150, "unit": "ml"}, {"name": "cebolla", "qty": 50, "unit": "g"}, {"name": "ajo", "qty": 2, "unit": "dientes"}, {"name": "aceite de oliva", "qty": 10, "unit": "ml"}]',
    '1. Hervir pasta. 2. Pochar cebolla y ajo. 3. Dorar carne. 4. Añadir tomate y cocinar 10 min. 5. Mezclar con pasta.',
    '{"kcal": 650, "protein": 42, "carbs": 72, "fat": 18}',
    1, 20,
    'Plato principal de día de entreno.'
  ),
  (
    'Ensalada de garbanzos',
    'Garbanzos con tomate cherry, pepino y vinagreta',
    array['fresh', 'protein', 'meal_prep', 'side'],
    '[{"name": "garbanzos cocidos", "qty": 200, "unit": "g"}, {"name": "tomate cherry", "qty": 100, "unit": "g"}, {"name": "pepino", "qty": 80, "unit": "g"}, {"name": "cebolla roja", "qty": 30, "unit": "g"}, {"name": "aceite de oliva", "qty": 15, "unit": "ml"}, {"name": "limón", "qty": 1, "unit": "unidad"}]',
    '1. Escurrir garbanzos. 2. Cortar tomate, pepino y cebolla. 3. Mezclar todo. 4. Aliñar con aceite y limón.',
    '{"kcal": 380, "protein": 18, "carbs": 40, "fat": 16}',
    2, 10,
    'Acompañamiento o base para añadir proteína.'
  ),
  (
    'Batido proteico post-entreno',
    'Proteína whey con plátano y leche de avena',
    array['quick', 'protein', 'fresh'],
    '[{"name": "proteína whey", "qty": 30, "unit": "g"}, {"name": "plátano", "qty": 1, "unit": "unidad"}, {"name": "leche de avena", "qty": 250, "unit": "ml"}, {"name": "hielo", "qty": 3, "unit": "cubos"}]',
    '1. Echar todo en batidora. 2. Batir 30 segundos. 3. Servir.',
    '{"kcal": 320, "protein": 32, "carbs": 38, "fat": 5}',
    1, 3,
    'Post-entreno inmediato.'
  ),
  (
    'Pollo al curry con boniato',
    'Curry suave de pollo con leche de coco y boniato',
    array['warm', 'protein', 'meal_prep'],
    '[{"name": "pechuga de pollo", "qty": 200, "unit": "g"}, {"name": "boniato", "qty": 150, "unit": "g"}, {"name": "leche de coco light", "qty": 100, "unit": "ml"}, {"name": "curry en polvo", "qty": 10, "unit": "g"}, {"name": "cebolla", "qty": 50, "unit": "g"}, {"name": "aceite de coco", "qty": 10, "unit": "ml"}]',
    '1. Cortar boniato en cubos y hornear 20min. 2. Saltear cebolla y pollo troceado. 3. Añadir curry y leche de coco. 4. Incorporar boniato. 5. Cocinar 5 min más.',
    '{"kcal": 580, "protein": 48, "carbs": 42, "fat": 20}',
    1, 35,
    'Reconfortante para días de descanso o cena de día entreno.'
  ),
  (
    'Wrap de pavo y hummus',
    'Tortilla integral con pavo, hummus y espinacas',
    array['quick', 'protein', 'fresh'],
    '[{"name": "tortilla integral", "qty": 1, "unit": "unidad"}, {"name": "pechuga de pavo", "qty": 80, "unit": "g"}, {"name": "hummus", "qty": 40, "unit": "g"}, {"name": "espinacas frescas", "qty": 30, "unit": "g"}, {"name": "tomate", "qty": 50, "unit": "g"}]',
    '1. Untar hummus en tortilla. 2. Colocar pavo, espinacas y tomate. 3. Enrollar.',
    '{"kcal": 340, "protein": 28, "carbs": 30, "fat": 12}',
    1, 5,
    'Comida rápida para llevar.'
  ),
  (
    'Revuelto de verduras y huevo',
    'Huevos revueltos con calabacín, champiñones y espinacas',
    array['warm', 'quick', 'protein'],
    '[{"name": "huevos", "qty": 3, "unit": "unidades"}, {"name": "calabacín", "qty": 100, "unit": "g"}, {"name": "champiñones", "qty": 80, "unit": "g"}, {"name": "espinacas", "qty": 50, "unit": "g"}, {"name": "aceite de oliva", "qty": 10, "unit": "ml"}]',
    '1. Saltear verduras troceadas. 2. Batir huevos y verter. 3. Revolver hasta cuajar. 4. Salpimentar.',
    '{"kcal": 320, "protein": 24, "carbs": 8, "fat": 22}',
    1, 10,
    'Cena ligera o complemento de cena.'
  ),
  (
    'Arroz con ternera y pimientos',
    'Salteado estilo asiático con ternera y verduras',
    array['warm', 'protein', 'meal_prep'],
    '[{"name": "arroz basmati", "qty": 140, "unit": "g"}, {"name": "ternera en tiras", "qty": 180, "unit": "g"}, {"name": "pimiento rojo", "qty": 80, "unit": "g"}, {"name": "pimiento verde", "qty": 80, "unit": "g"}, {"name": "salsa de soja", "qty": 20, "unit": "ml"}, {"name": "jengibre fresco", "qty": 5, "unit": "g"}, {"name": "aceite de sésamo", "qty": 10, "unit": "ml"}]',
    '1. Cocinar arroz. 2. Saltear ternera a fuego alto con jengibre. 3. Añadir pimientos. 4. Incorporar soja y sésamo. 5. Servir sobre arroz.',
    '{"kcal": 680, "protein": 46, "carbs": 65, "fat": 22}',
    1, 25,
    'Plato estrella de día de entreno.'
  ),
  (
    'Tostadas con queso cottage y tomate',
    'Pan integral con cottage cheese, tomate y orégano',
    array['quick', 'protein', 'fresh'],
    '[{"name": "pan integral", "qty": 2, "unit": "rebanadas"}, {"name": "queso cottage", "qty": 100, "unit": "g"}, {"name": "tomate", "qty": 1, "unit": "unidad"}, {"name": "orégano", "qty": 2, "unit": "g"}, {"name": "aceite de oliva", "qty": 5, "unit": "ml"}]',
    '1. Tostar pan. 2. Untar cottage. 3. Rodajas de tomate encima. 4. Orégano y chorrito de aceite.',
    '{"kcal": 310, "protein": 20, "carbs": 32, "fat": 10}',
    1, 5,
    'Desayuno rápido o snack.'
  ),
  (
    'Sopa de pollo y verduras',
    'Caldo casero con pechuga desmechada y verduras',
    array['warm', 'protein', 'light'],
    '[{"name": "pechuga de pollo", "qty": 150, "unit": "g"}, {"name": "zanahoria", "qty": 80, "unit": "g"}, {"name": "apio", "qty": 50, "unit": "g"}, {"name": "patata", "qty": 100, "unit": "g"}, {"name": "caldo de pollo", "qty": 500, "unit": "ml"}, {"name": "perejil", "qty": 5, "unit": "g"}]',
    '1. Hervir caldo con zanahoria, apio y patata 15 min. 2. Añadir pollo y cocer 10 min. 3. Desmechar pollo. 4. Servir con perejil.',
    '{"kcal": 350, "protein": 38, "carbs": 28, "fat": 8}',
    2, 30,
    'Reconfortante para cena de día descanso.'
  );

-- ============================================
-- MEAL PLANS (example — one day per user)
-- ============================================
-- Add as many days as you need. Replace USER_1_UUID / USER_2_UUID before running.

insert into public.meal_plans (user_id, date, day_type, meals, total_kcal, total_protein, notes)
values
  (
    'USER_1_UUID',
    '2026-01-01', 'training',
    '[
      {"time": "13:00", "label": "Romper ayuno", "name": "Bowl de pollo y arroz", "items": ["200g pechuga pollo", "150g arroz integral", "100g brócoli"], "kcal": 620, "protein": 52},
      {"time": "16:30", "label": "Pre-entreno", "name": "Yogur griego con frutos secos", "items": ["200g yogur griego", "20g nueces", "50g arándanos"], "kcal": 290, "protein": 22},
      {"time": "18:30", "label": "Post-entreno", "name": "Batido proteico", "items": ["30g whey", "1 plátano", "250ml leche avena"], "kcal": 320, "protein": 32},
      {"time": "20:30", "label": "Cena", "name": "Revuelto de verduras y huevo", "items": ["3 huevos", "100g calabacín", "80g champiñones"], "kcal": 320, "protein": 24}
    ]',
    1550, 130,
    'Día de entreno — ejemplo'
  ),
  (
    'USER_2_UUID',
    '2026-01-01', 'rest',
    '[
      {"time": "08:30", "label": "Desayuno", "name": "Tortilla francesa proteica", "items": ["3 claras", "1 huevo", "20g jamón", "queso"], "kcal": 230, "protein": 28},
      {"time": "13:30", "label": "Comida", "name": "Pasta con carne picada", "items": ["80g pasta", "120g carne", "tomate casero"], "kcal": 520, "protein": 34},
      {"time": "20:30", "label": "Cena", "name": "Wrap de pavo y hummus", "items": ["1 tortilla", "60g pavo", "30g hummus", "espinacas"], "kcal": 290, "protein": 22}
    ]',
    1040, 84,
    'Día de descanso — ejemplo'
  );
