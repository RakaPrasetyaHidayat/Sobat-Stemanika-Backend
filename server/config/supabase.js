import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://twsdksnrxqcklfnatoqc.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3c2Rrc25yeHFja2xmbmF0b3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MjUwNzcsImV4cCI6MjA3NzEwMTA3N30.xy7vWn9uvVWE55V1g9eE1V4S0eyvscBvB82J9yrmnVE";

export const supabase = createClient(supabaseUrl, supabaseKey);
