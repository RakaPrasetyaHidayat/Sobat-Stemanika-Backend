/**
 * Environment Variables Validator
 * Diagnoses and validates Supabase connection configuration
 */

import 'dotenv/config';

export class EnvValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validated = false;
  }

  /**
   * Run all validation checks
   */
  validate() {
    console.log('🔍 Starting environment validation...\n');

    this.checkVariablesExist();
    this.checkVariablesFormat();
    this.checkSupabaseUrl();
    this.checkProductionSetup();

    this.validated = true;
    return this;
  }

  /**
   * Check if all required variables exist
   */
  checkVariablesExist() {
    console.log('1️⃣  Checking required variables...');

    const required = ['SUPABASE_URL', 'SUPABASE_ANON_PUBLIC_KEY', 'JWT_SECRET'];

    required.forEach((varName) => {
      const value = process.env[varName];
      if (!value) {
        this.errors.push(`❌ Missing: ${varName}`);
        console.log(`   ❌ ${varName}: NOT SET`);
      } else {
        const masked = this.maskValue(value);
        console.log(`   ✅ ${varName}: ${masked}`);
      }
    });

    console.log('');
  }

  /**
   * Validate variable formats
   */
  checkVariablesFormat() {
    console.log('2️⃣  Checking variable formats...');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_PUBLIC_KEY;

    // Check URL format
    if (supabaseUrl) {
      try {
        new URL(supabaseUrl);
        console.log(`   ✅ SUPABASE_URL format: VALID`);
      } catch {
        this.errors.push(
          `Invalid SUPABASE_URL format: "${supabaseUrl}". Must be a valid URL.`
        );
        console.log(`   ❌ SUPABASE_URL format: INVALID`);
      }
    }

    // Check key format (should be long alphanumeric)
    if (supabaseKey) {
      if (supabaseKey.length > 20 && /^[a-zA-Z0-9_-]+$/.test(supabaseKey)) {
        console.log(`   ✅ SUPABASE_ANON_PUBLIC_KEY format: VALID`);
      } else {
        this.warnings.push(
          `SUPABASE_ANON_PUBLIC_KEY might be invalid (length: ${supabaseKey.length})`
        );
        console.log(`   ⚠️  SUPABASE_ANON_PUBLIC_KEY format: SUSPICIOUS`);
      }
    }

    // Check JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length >= 32) {
      console.log(`   ✅ JWT_SECRET length: SUFFICIENT (${jwtSecret.length} chars)`);
    } else if (jwtSecret) {
      this.warnings.push(
        `JWT_SECRET is short (${jwtSecret.length} chars). Recommended: ≥32 chars`
      );
      console.log(`   ⚠️  JWT_SECRET length: WEAK (${jwtSecret.length} chars)`);
    }

    console.log('');
  }

  /**
   * Validate Supabase URL specifically
   */
  checkSupabaseUrl() {
    console.log('3️⃣  Checking Supabase URL details...');

    const supabaseUrl = process.env.SUPABASE_URL;

    if (!supabaseUrl) {
      this.errors.push('SUPABASE_URL is required');
      console.log('   ❌ No SUPABASE_URL to check\n');
      return;
    }

    try {
      const url = new URL(supabaseUrl);

      // Check domain
      if (!url.hostname.includes('supabase')) {
        this.warnings.push(
          `Hostname doesn't contain "supabase": ${url.hostname}`
        );
        console.log(`   ⚠️  Hostname: ${url.hostname} (not standard Supabase)`);
      } else {
        console.log(`   ✅ Hostname: ${url.hostname}`);
      }

      // Check protocol
      if (url.protocol === 'https:') {
        console.log(`   ✅ Protocol: HTTPS (secure)`);
      } else if (url.protocol === 'http:') {
        this.warnings.push('Using HTTP instead of HTTPS. Insecure!');
        console.log(`   ⚠️  Protocol: HTTP (insecure)`);
      }

      // Check path
      console.log(`   ℹ️  Full URL: ${supabaseUrl}`);
    } catch (err) {
      this.errors.push(`Failed to parse SUPABASE_URL: ${err.message}`);
      console.log(`   ❌ URL parsing failed: ${err.message}`);
    }

    console.log('');
  }

  /**
   * Check production vs development setup
   */
  checkProductionSetup() {
    console.log('4️⃣  Checking deployment setup...');

    const nodeEnv = process.env.NODE_ENV || 'development';
    console.log(`   ℹ️  NODE_ENV: ${nodeEnv}`);

    if (nodeEnv === 'production') {
      console.log('   ℹ️  Production mode detected');
      console.log(
        '   📝 Ensure all environment variables are set in Vercel/Deployment dashboard'
      );
    } else {
      console.log('   ℹ️  Development mode detected');
      console.log('   📝 Make sure .env file is in root directory');
    }

    console.log('');
  }

  /**
   * Mask sensitive values for logging
   */
  maskValue(value) {
    if (!value || value.length < 10) return '***';
    const start = value.substring(0, 5);
    const end = value.substring(value.length - 5);
    return `${start}...${end} (${value.length} chars)`;
  }

  /**
   * Print diagnostic report
   */
  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 ENVIRONMENT VALIDATION REPORT');
    console.log('='.repeat(60) + '\n');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All checks passed! Environment is properly configured.\n');
      return true;
    }

    if (this.errors.length > 0) {
      console.log('❌ ERRORS (Critical):\n');
      this.errors.forEach((error) => {
        console.log(`   • ${error}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS (Non-critical):\n');
      this.warnings.forEach((warning) => {
        console.log(`   • ${warning}`);
      });
      console.log('');
    }

    console.log('='.repeat(60) + '\n');

    return this.errors.length === 0;
  }

  /**
   * Get troubleshooting guide
   */
  getTroubleshootingGuide() {
    const guide = `
🔧 TROUBLESHOOTING GUIDE
========================

If you're getting "TypeError: fetch failed", follow these steps:

1. LOCAL TESTING:
   • Run: npm run dev
   • If works locally → Problem is in Vercel/Production environment
   • If fails locally → Problem is in .env file or configuration

2. CHECK .ENV FILE:
   • Location: Create file at project root (next to package.json)
   • Add three variables:
     SUPABASE_URL=https://xxxxx.supabase.co
     SUPABASE_ANON_PUBLIC_KEY=eyJxxxxxx
     JWT_SECRET=your_jwt_secret_here_min_32_chars

3. GET VALUES FROM SUPABASE:
   • Go to: https://app.supabase.com
   • Select your project
   • Settings > API
   • Copy "Project URL" → SUPABASE_URL
   • Copy "anon public" key → SUPABASE_ANON_PUBLIC_KEY

4. FOR VERCEL DEPLOYMENT:
   • Go to: vercel.com/dashboard
   • Select your project
   • Settings > Environment Variables
   • Add all three variables (same as .env)
   • Redeploy the project

5. VERIFY SUPABASE CREDENTIALS:
   • Test in browser: curl -i YOUR_SUPABASE_URL
   • Should return 404 or similar (not connection error)

6. CHECK FIREWALL:
   • Supabase usually allows all origins
   • But verify in Supabase: Settings > Security
   • Look for CORS or IP restrictions
    `;

    return guide;
  }
}

/**
 * Run validation and export results
 */
export function validateEnvironment() {
  const validator = new EnvValidator();
  validator.validate();
  const isValid = validator.printReport();

  if (!isValid) {
    console.log(validator.getTroubleshootingGuide());
    process.exit(1);
  }

  return validator;
}

// Export for use in server.js
export default validateEnvironment;
