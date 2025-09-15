import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL! || 'https://twgztiivapvkfieciwfd.supabase.co'; 
const supabaseAnonKey = process.env.INTERNAL_API_KEY! || 'sb_secret_WpHK6bL96dGcftWzsygyeg_w2mR-fow';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);