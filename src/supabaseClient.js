// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPBASE_URL;
const supabaseKey = process.env.REACT_APP_SUPBASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
