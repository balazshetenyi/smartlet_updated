/**
 * Environment configuration and validation
 * Ensures all required environment variables are present
 */

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_FUNCTIONS_URL: string;
  OPENCAGE_API_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
}

function validateEnv(): EnvConfig {
  const requiredVars = {
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.EXPO_PUBLIC_SUPABASE_SECRET_KEY,
    SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_FUNCTIONS_URL: process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL,
    OPENCAGE_API_KEY: process.env.EXPO_PUBLIC_OPENCAGE_API_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    ENVIRONMENT: (process.env.EXPO_PUBLIC_ENVIRONMENT || 'development') as 'development' | 'staging' | 'production',
  };

  const missing: string[] = [];

  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value && key !== 'ENVIRONMENT') {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  return requiredVars as EnvConfig;
}

export const env = validateEnv();

// Helper functions
export const isDevelopment = env.ENVIRONMENT === 'development';
export const isProduction = env.ENVIRONMENT === 'production';
export const isStaging = env.ENVIRONMENT === 'staging';
