import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
    "https://mtljmvivztkgoolnnwxc.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bGptdml2enRrZ29vbG5ud3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDMzNDMsImV4cCI6MjA3ODk3OTM0M30.W1pUpANUhTIABj79S-c7C14Kfuk_p4hkbkW6FnzIX5M"
);
