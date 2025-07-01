import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://ublronrkocpedtkhyvbf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVibHJvbnJrb2NwZWR0a2h5dmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzU2MzgsImV4cCI6MjA2Njk1MTYzOH0.5UAci8Y6yH08teTuztkjE3F0WyLlLMrheFyhSFa7H30"
);