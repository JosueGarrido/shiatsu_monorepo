import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const email = process.env.TEST_EMAIL!;
const password = process.env.TEST_PASSWORD!;

const supabase = createClient(url, anonKey);

async function main() {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  console.log("access_token:", data.session?.access_token);
}

main().catch((e) => {
  console.error("TOKEN FAILED:", e);
  process.exit(1);
});