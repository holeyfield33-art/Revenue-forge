"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient_() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
