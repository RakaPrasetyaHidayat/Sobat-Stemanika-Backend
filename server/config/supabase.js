import { createClient } from "@supabase/supabase-js";

/**
 * Supabase configuration and client initialization
 *
 * This module handles the setup and validation of Supabase client configuration
 * for database operations in the STEMANIKA voting system.
 */

// Environment variable validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_PUBLIC_KEY;
const jwtSecret = process.env.JWT_SECRET;

// Validate required environment variables
const missingVars = [];

if (!supabaseUrl) {
  missingVars.push("SUPABASE_URL");
}

if (!supabaseKey) {
  missingVars.push("SUPABASE_ANON_PUBLIC_KEY");
}

if (!jwtSecret) {
  missingVars.push("JWT_SECRET");
}

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(", ")}. Please configure these in your Vercel dashboard or .env.local file.`);
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid SUPABASE_URL format: ${supabaseUrl}`);
}

// Supabase client configuration options
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'stemanika-server@1.0.0'
    }
  }
};

/**
 * Supabase client instance
 * Configured with environment variables and optimized settings
 */
export const supabase = createClient(supabaseUrl, supabaseKey, supabaseOptions);

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('id', { count: 'exact', head: true });

    return !error;
  } catch (error) {
    console.error('Supabase connection test failed:', error.message);
    return false;
  }
};

/**
 * Get Supabase configuration info (for debugging)
 * @returns {Object} Configuration information
 */
export const getConfig = () => ({
  url: supabaseUrl.replace(/https?:\/\/[^@]+@/, 'https://***:***@'), // Mask credentials
  hasKey: !!supabaseKey,
  options: supabaseOptions
});
