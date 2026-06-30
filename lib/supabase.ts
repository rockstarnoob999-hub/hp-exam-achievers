import { createClient } from "@supabase/supabase-js";

// Server-side client using the service role key (full DB access).
// Never expose SUPABASE_SERVICE_ROLE_KEY to the browser — it is only used in API routes.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
