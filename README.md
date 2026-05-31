# WhatsCookin

WhatsCookin is an ingredient-first recipe discovery app for finding, creating, saving, importing, and cooking recipes. It is built as a mobile-width React experience with Supabase-backed auth/data, AI recipe generation, universal recipe import, grocery lists, meal planning, social features, and an Android Capacitor wrapper.

## Features

- Discover recipes by ingredient, category, search, and filters.
- Generate recipes from ingredients with AI.
- Import recipes from websites, YouTube, TikTok, images, and pasted text.
- Save favorites, organize collections, publish personal recipes, and keep drafts.
- Cook with step-by-step cooking mode, timers, wake lock, and speech helpers.
- Build grocery lists from recipes and manage a weekly meal plan.
- Review recipes, follow cooks, view profiles, receive notifications, and chat.
- Installable PWA with a native Android project via Capacitor.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4 + DaisyUI
- Supabase Auth, database, storage, and edge functions
- OpenAI-compatible chat completions for AI generation and recipe extraction
- Capacitor for Android packaging

## Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project
- An OpenAI API key for AI generation and import extraction
- Android Studio if you want to build or run the Android app

## Environment Variables

Create a local `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_APP_URL=http://localhost:3000
```

`VITE_OPENAI_MODEL` and `VITE_APP_URL` are optional. The app defaults the model to `gpt-4o-mini`, and auth redirects fall back to the current browser origin.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Supabase

The app expects Supabase to provide authentication, recipe data, user profiles, social data, storage, and edge functions used by import flows.

Useful project files:

- `supabase/config.toml` - local Supabase configuration
- `supabase/add_ingredient_matching.sql` - database helper SQL
- `supabase/functions/fetch-url` - URL fetching edge function
- `supabase/functions/extract-recipe` - recipe extraction edge function

If auth redirects do not return to the app, add your local and deployed app URLs in Supabase Auth settings.

## Android

The Android project lives in `android/` and uses the Capacitor config in `capacitor.config.ts`.

Build the web app before syncing native assets:

```bash
npm run build
npx cap sync android
```

Open the Android project:

```bash
npx cap open android
```

## Project Structure

```text
src/
  components/      Shared UI, navigation, recipe, social, and layout components
  contexts/        App-level React contexts
  hooks/           Auth, recipe, grocery, meal planning, social, and UI hooks
  lib/             Supabase client and shared app helpers
  pages/           Screen-level app experiences
  services/        AI, import, user, recipe, and media services
  types/           Shared TypeScript types
  utils/           Media, grocery, sharing, and accessibility utilities
supabase/          Supabase config, SQL, and edge functions
android/           Capacitor Android project
docs/              Project notes and walkthroughs
```

## Notes

- Environment variables are read at build time by Vite, so restart the dev server after changing `.env`.
- `VITE_` variables are exposed to the browser. Use only public client keys there, such as the Supabase anon key. Do not put service-role keys in the frontend environment.
- AI calls currently run from the frontend, so use suitable development keys and move sensitive production flows behind a server or edge function before shipping broadly.
