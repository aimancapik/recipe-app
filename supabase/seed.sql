-- ============================================================
-- SEED DATA: Insert existing recipes into Supabase
-- Run this AFTER schema.sql in the SQL Editor
-- Uses gen_random_uuid() so every ID is unique and random
-- ============================================================

DO $$
DECLARE
    r1 uuid := gen_random_uuid();
    r2 uuid := gen_random_uuid();
    r3 uuid := gen_random_uuid();
    r4 uuid := gen_random_uuid();
    r5 uuid := gen_random_uuid();
    r6 uuid := gen_random_uuid();
    r7 uuid := gen_random_uuid();
    r8 uuid := gen_random_uuid();
    r9 uuid := gen_random_uuid();
    r10 uuid := gen_random_uuid();
BEGIN

-- Recipe 1: Avocado & Egg Toast
INSERT INTO recipes (id, title, image, prep_time, rating, reviews, serves, kcal, level, category, status)
VALUES (r1, 'Avocado & Egg Toast', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600', '15m', 4.8, 156, '01', '320', 'Easy', 'breakfast', 'published');

INSERT INTO ingredients (recipe_id, name, sort_order) VALUES
(r1, '1 Ripe avocado', 0),
(r1, '2 Slices sourdough', 1),
(r1, '1 Poached egg', 2),
(r1, 'Red pepper flakes', 3);

INSERT INTO directions (recipe_id, step, title, description, image, sort_order) VALUES
(r1, 1, 'Toast bread', 'Toast the sourdough slices until golden.', NULL, 0),
(r1, 2, 'Mash avocado', 'Mash avocado and spread it.', 'https://images.unsplash.com/photo-1603046891726-36cefd07da7b?w=400', 1);

-- Recipe 2: Acai Smoothie Bowl
INSERT INTO recipes (id, title, image, prep_time, rating, reviews, serves, kcal, level, category)
VALUES (r2, 'Acai Smoothie Bowl', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600', '10m', 4.9, 120, '01', '280', 'Easy', 'vegan');

INSERT INTO ingredients (recipe_id, name, sort_order) VALUES
(r2, 'Acai puree', 0),
(r2, 'Frozen berries', 1),
(r2, 'Granola', 2),
(r2, 'Chia seeds', 3);

INSERT INTO directions (recipe_id, step, title, description, image, sort_order) VALUES
(r2, 1, 'Blend', 'Blend acai and berries until smooth and thick.', NULL, 0),
(r2, 2, 'Add toppings', 'Pour into a bowl and top with granola, chia seeds, and fresh berries.', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400', 1);

-- Recipe 3: Classic Carbonara
INSERT INTO recipes (id, title, image, prep_time, rating, reviews, serves, kcal, level, category)
VALUES (r3, 'Classic Carbonara', 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600', '25m', 4.5, 210, '02', '650', 'Medium', 'dinner');

INSERT INTO ingredients (recipe_id, name, sort_order) VALUES
(r3, 'Spaghetti', 0),
(r3, 'Pancetta', 1),
(r3, 'Eggs', 2),
(r3, 'Pecorino Romano', 3);

INSERT INTO directions (recipe_id, step, title, description, image, timer, sort_order) VALUES
(r3, 1, 'Boil pasta', 'Cook spaghetti in a large pot of well-salted boiling water until al dente.', NULL, 600, 0),
(r3, 2, 'Cook pancetta', 'Fry pancetta in a pan until crispy and golden. Reserve the rendered fat.', 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400', NULL, 1),
(r3, 3, 'Mix eggs and cheese', 'Whisk eggs with grated Pecorino Romano and black pepper in a bowl.', NULL, NULL, 2),
(r3, 4, 'Combine and serve', 'Toss hot pasta with pancetta, then quickly stir in egg mixture off heat. Serve immediately.', 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', NULL, 3);

-- Recipe 4: Lemon Garlic Salmon
INSERT INTO recipes (id, title, image, prep_time, rating, reviews, serves, kcal, level, category)
VALUES (r4, 'Lemon Garlic Salmon', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600', '20m', 4.7, 89, '01', '410', 'Medium', 'seafood');

INSERT INTO ingredients (recipe_id, name, sort_order) VALUES
(r4, 'Salmon fillet', 0),
(r4, 'Garlic', 1),
(r4, 'Lemon', 2),
(r4, 'Asparagus', 3);

INSERT INTO directions (recipe_id, step, title, description, image, timer, sort_order) VALUES
(r4, 1, 'Season the salmon', 'Pat salmon dry and season with salt, pepper, and minced garlic.', NULL, NULL, 0),
(r4, 2, 'Sear salmon', 'Heat oil in a pan and sear salmon skin-side down for 4 minutes until crispy.', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', 240, 1),
(r4, 3, 'Add lemon and asparagus', 'Flip the salmon, add lemon slices and asparagus. Cook for another 3 minutes.', NULL, NULL, 2);

-- Recipe 5: Crepes with Orange and Honey
INSERT INTO recipes (id, title, image, prep_time, rating, reviews, serves, kcal, level, category, status)
VALUES (r5, 'Crepes with Orange and Honey', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4bDORqJU5HbmYgi-2yZGNFoHdinjtjPSXHa1_HNGMKsAbiV2XxkjSGposR-8nTaEFxUaTg_oGZI0o_po4eJpMrfsVsi7GEinelDgBEJY8YbKPumMSL9H3u_cP5PdaFxjO_IozYoIefJqMIhPmeteTtKDKGNY-l98EVlh2tR4MeK6E0ICk5--U9GTAKoeeABM5H69k30CeuT8_cTOGc9CxlpTd1dA8cEjU8tkFBrgtJ4XCIc2I5MXI3KlYQVc51ru7gKiU1QShA9k', '35m', 4.8, 120, '03', '103', 'Easy', 'breakfast', 'published');

INSERT INTO ingredients (recipe_id, name, sort_order) VALUES
(r5, '2 Large organic eggs', 0),
(r5, '1 Cup all-purpose flour', 1),
(r5, '1/2 Cup whole milk', 2),
(r5, '2 tbsp unsalted butter, melted', 3),
(r5, '1 tbsp organic honey', 4),
(r5, '1 tsp Fresh orange zest', 5);

INSERT INTO directions (recipe_id, step, title, description, image, sort_order) VALUES
(r5, 1, 'Prepare the batter', 'In a large mixing bowl, whisk the eggs and flour together until well combined.', NULL, 0),
(r5, 2, 'Add liquids', 'Gradually add the milk and melted butter, whisking constantly to prevent lumps from forming.', NULL, 1),
(r5, 3, 'Cook the crepes', 'Heat a non-stick pan over medium heat and pour a thin layer of batter. Swirl to coat the pan.', 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400', 2),
(r5, 4, 'Serve and enjoy', 'Cook until golden brown on both sides. Serve warm with a drizzle of honey and orange slices.', 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400', 3);

-- Recipe 6: Chicken Tikka Masala
INSERT INTO recipes (id, title, image, prep_time, rating, reviews, serves, kcal, level, category, status)
VALUES (r6, 'Chicken Tikka Masala', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', '45m', 4.9, 312, '04', '520', 'Medium', 'dinner', 'published');

INSERT INTO ingredients (recipe_id, name, sort_order) VALUES
(r6, '500g Chicken breast, cubed', 0),
(r6, '1 Cup plain yogurt', 1),
(r6, '2 tbsp Tikka masala paste', 2),
(r6, '1 Can crushed tomatoes', 3),
(r6, '1 Cup heavy cream', 4),
(r6, '1 Large onion, diced', 5),
(r6, '3 Cloves garlic, minced', 6),
(r6, 'Fresh cilantro for garnish', 7);

INSERT INTO directions (recipe_id, step, title, description, image, sort_order) VALUES
(r6, 1, 'Marinate the chicken', 'Mix chicken with yogurt and tikka paste. Refrigerate for at least 30 minutes, or overnight for best results.', NULL, 0),
(r6, 2, 'Cook the chicken', 'Grill or pan-sear the marinated chicken until charred and cooked through. Set aside.', 'https://images.unsplash.com/photo-1532636875304-0c89f5610bba?w=400', 1),
(r6, 3, 'Make the sauce', 'Sauté onion and garlic, add crushed tomatoes and simmer for 15 minutes. Stir in heavy cream.', NULL, 2),
(r6, 4, 'Combine and serve', 'Add the cooked chicken to the sauce. Simmer for 5 minutes. Garnish with cilantro and serve with rice or naan.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', 3);

-- Recipe 7: Mediterranean Greek Salad
INSERT INTO recipes (id, title, image, prep_time, rating, reviews, serves, kcal, level, category)
VALUES (r7, 'Mediterranean Greek Salad', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600', '10m', 4.6, 98, '02', '220', 'Easy', 'vegan');

INSERT INTO ingredients (recipe_id, name, sort_order) VALUES
(r7, '2 Large tomatoes, chopped', 0),
(r7, '1 Cucumber, sliced', 1),
(r7, '1/2 Red onion, thinly sliced', 2),
(r7, '200g Feta cheese, cubed', 3),
(r7, 'Kalamata olives', 4),
(r7, 'Extra virgin olive oil', 5),
(r7, '1 tsp Dried oregano', 6);

INSERT INTO directions (recipe_id, step, title, description, image, sort_order) VALUES
(r7, 1, 'Prep vegetables', 'Chop the tomatoes into wedges, slice the cucumber, and thinly slice the red onion.', NULL, 0),
(r7, 2, 'Assemble the salad', 'Combine all vegetables in a large bowl. Add olives and feta cheese on top.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', 1),
(r7, 3, 'Dress and serve', 'Drizzle generously with olive oil, sprinkle with oregano, and season with salt and pepper.', NULL, 2);

-- Recipe 8: Fluffy Banana Pancakes
INSERT INTO recipes (id, title, image, prep_time, rating, reviews, serves, kcal, level, category)
VALUES (r8, 'Fluffy Banana Pancakes', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600', '20m', 4.7, 185, '02', '380', 'Easy', 'breakfast');

INSERT INTO ingredients (recipe_id, name, sort_order) VALUES
(r8, '2 Ripe bananas, mashed', 0),
(r8, '2 Large eggs', 1),
(r8, '1 Cup all-purpose flour', 2),
(r8, '1/2 Cup milk', 3),
(r8, '2 tbsp Maple syrup', 4),
(r8, '1 tsp Baking powder', 5),
(r8, 'Butter for cooking', 6);

INSERT INTO directions (recipe_id, step, title, description, image, sort_order) VALUES
(r8, 1, 'Make batter', 'Mash the bananas in a bowl. Add eggs and milk, whisk until smooth. Fold in flour and baking powder.', NULL, 0),
(r8, 2, 'Cook pancakes', 'Heat a buttered pan over medium-low heat. Pour 1/4 cup batter per pancake. Cook until bubbles form, then flip.', 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400', 1),
(r8, 3, 'Serve', 'Stack the pancakes, drizzle with maple syrup, and top with sliced bananas and a pat of butter.', NULL, 2);

-- Recipe 9: Shrimp Pad Thai
INSERT INTO recipes (id, title, image, prep_time, rating, reviews, serves, kcal, level, category)
VALUES (r9, 'Shrimp Pad Thai', 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600', '30m', 4.8, 234, '02', '450', 'Medium', 'seafood');

INSERT INTO ingredients (recipe_id, name, sort_order) VALUES
(r9, '200g Rice noodles', 0),
(r9, '300g Large shrimp, peeled', 1),
(r9, '2 Eggs, beaten', 2),
(r9, '1 Cup Bean sprouts', 3),
(r9, '3 tbsp Fish sauce', 4),
(r9, '2 tbsp Tamarind paste', 5),
(r9, '2 tbsp Brown sugar', 6),
(r9, 'Crushed peanuts & lime wedges', 7);

INSERT INTO directions (recipe_id, step, title, description, image, timer, sort_order) VALUES
(r9, 1, 'Prep noodles', 'Soak rice noodles in warm water for 20 minutes until pliable. Drain and set aside.', NULL, 1200, 0),
(r9, 2, 'Make the sauce', 'Whisk together fish sauce, tamarind paste, and brown sugar in a small bowl.', NULL, NULL, 1),
(r9, 3, 'Stir-fry', 'Cook shrimp in a hot wok until pink. Push to side, scramble the eggs, then add noodles and sauce. Toss everything together.', 'https://images.unsplash.com/photo-1543826173-1beeb97525d8?w=400', NULL, 2),
(r9, 4, 'Serve', 'Top with bean sprouts, crushed peanuts, and a squeeze of fresh lime juice.', 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400', NULL, 3);

-- Recipe 10: Creamy Mushroom Risotto
INSERT INTO recipes (id, title, image, prep_time, rating, reviews, serves, kcal, level, category)
VALUES (r10, 'Creamy Mushroom Risotto', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600', '40m', 4.5, 142, '03', '480', 'Hard', 'dinner');

INSERT INTO ingredients (recipe_id, name, sort_order) VALUES
(r10, '1.5 Cups Arborio rice', 0),
(r10, '300g Mixed mushrooms, sliced', 1),
(r10, '4 Cups warm chicken or vegetable broth', 2),
(r10, '1/2 Cup dry white wine', 3),
(r10, '1 Medium onion, finely diced', 4),
(r10, '3 tbsp Butter', 5),
(r10, '1/2 Cup Parmesan cheese, grated', 6),
(r10, 'Fresh thyme sprigs', 7);

INSERT INTO directions (recipe_id, step, title, description, image, sort_order) VALUES
(r10, 1, 'Sauté mushrooms', 'Cook sliced mushrooms in butter over high heat until golden brown and caramelized. Season and set aside.', 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=400', 0),
(r10, 2, 'Toast the rice', 'Sauté onion until translucent, add Arborio rice and stir for 2 minutes until the edges become translucent.', NULL, 1),
(r10, 3, 'Add wine and broth', 'Pour in wine and stir until absorbed. Add warm broth one ladle at a time, stirring constantly, waiting for each addition to be absorbed.', NULL, 2),
(r10, 4, 'Finish and serve', 'After about 18 minutes, stir in mushrooms, butter and Parmesan. The risotto should be creamy and flow like lava. Garnish with thyme.', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400', 3);

END $$;
