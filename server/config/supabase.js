import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';
import { validateEnvironment } from '../utils/envValidator.js';

// Run environment validation on startup
console.log('\n🔐 Validating environment configuration...\n');
const envValidator = validateEnvironment();

// Get validated environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_PUBLIC_KEY;
const jwtSecret = process.env.JWT_SECRET;

// Final safety check (should not reach here if envValidator worked)
if (!supabaseUrl || !supabaseKey || !jwtSecret) {
  throw new Error(
    'Critical: Required environment variables are missing. ' +
    'Check SUPABASE_URL, SUPABASE_ANON_PUBLIC_KEY, and JWT_SECRET'
  );
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
 * Test database connection with retry logic
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<boolean>} Connection status
 */
export const testConnection = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\n🧪 Testing Supabase connection (Attempt ${attempt}/${retries})...`);

      const { data, error } = await supabase
        .from('Users')
        .select('id', { count: 'exact', head: true });

      if (error) {
        console.error(`   ❌ Query error: ${error.message}`);
        if (attempt === retries) {
          throw error;
        }
        // Wait before retry
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }

      console.log('   ✅ Connection successful!');
      return true;
    } catch (error) {
      console.error(`   ❌ Connection attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        console.error(`\n❌ Failed to connect after ${retries} attempts`);
        console.error('📌 Check your Supabase credentials:');
        console.error('   1. SUPABASE_URL must start with https://');
        console.error('   2. SUPABASE_ANON_PUBLIC_KEY must be a valid key from Supabase');
        console.error('   3. Firewall rules should allow your IP');
        return false;
      }

      // Wait before retry
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  return false;
};

/**
 * Get Supabase configuration info (for debugging)
 * @returns {Object} Configuration information
 */
export const getConfig = () => ({
  url: supabaseUrl,
  hasKey: !!supabaseKey,
  options: supabaseOptions
});
