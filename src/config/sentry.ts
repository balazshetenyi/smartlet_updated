/**
 * Sentry Configuration for Error Tracking
 *
 * Setup Instructions:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new project for React Native
 * 3. Add EXPO_PUBLIC_SENTRY_DSN to your .env file
 * 4. Update the environment in the init() call based on your deployment
 */

import * as Sentry from '@sentry/react-native';
import { isProduction, isDevelopment, env } from './env';

export function initSentry() {
  // Only initialize Sentry if DSN is provided
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!sentryDsn) {
    if (isProduction) {
      console.warn('Sentry DSN not configured for production environment');
    }
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: env.ENVIRONMENT,

    // Enable or disable Sentry based on environment
    enabled: isProduction || process.env.EXPO_PUBLIC_ENABLE_SENTRY === 'true',

    // Debug mode for development
    debug: isDevelopment,

    // Sample rate for traces (adjust based on your needs)
    tracesSampleRate: isProduction ? 0.2 : 1.0,

    // Filter out sensitive information
    beforeSend(event, hint) {
      // Remove sensitive data from events
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }

      // Filter out specific errors
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message).toLowerCase();

        // Don't send network errors in development
        if (isDevelopment && message.includes('network')) {
          return null;
        }
      }

      return event;
    },

    // Integrate with React Native
    integrations: [
      new Sentry.ReactNativeTracing({
        tracingOrigins: ['localhost', /^\//],
        routingInstrumentation: Sentry.reactNavigationIntegration(),
      }),
    ],
  });
}

// Helper function to capture errors
export function captureError(error: Error, context?: Record<string, any>) {
  if (isDevelopment) {
    console.error('Error captured:', error, context);
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper function to set user context
export function setUserContext(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

// Helper function to clear user context (on logout)
export function clearUserContext() {
  Sentry.setUser(null);
}

// Helper function to add breadcrumb
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
