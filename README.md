<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/bb7e867f-af43-4b23-87ab-7cd303acd030

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. Copy `.env.example` → `.env` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. In Supabase SQL Editor, run `supabase/schema.sql` then `supabase/rls.sql`
4. Run the app: `npm run dev`

On Vercel, add the same `VITE_SUPABASE_*` env vars.
