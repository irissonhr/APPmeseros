// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bxauddmmhhazzkxkukzk.supabase.co';
const supabaseAnonKey = 'sb_publishable_dm1kzPl1utJTXxeAPEobJA_4Nsu96-q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
