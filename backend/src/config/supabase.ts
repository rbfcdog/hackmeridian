import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL! || 'https://twgztiivapvkfieciwfd.supabase.co'; 
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY! || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Z3p0aWl2YXB2a2ZpZWNpd2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NzgxODIsImV4cCI6MjA3MzQ1NDE4Mn0.0XCi-Dj16zSTzI6vlGNHjrBk1YyAzBUHT61_06hBbzU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);