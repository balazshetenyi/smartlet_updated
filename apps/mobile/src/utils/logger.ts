/**
 * Logger utility for the Kiado application
 * - Prevents sensitive data from being logged in production
 * - Provides consistent logging interface
 * - Can be extended to integrate with error tracking services
 */

const isDevelopment = process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production';

class Logger {
    private shouldLog(): boolean {
        return isDevelopment || __DEV__;
    }

    log(...args: any[]) {
        if (this.shouldLog()) {
            console.log('[Kiado]', ...args);
        }
    }

    info(...args: any[]) {
        if (this.shouldLog()) {
            console.info('[Kiado INFO]', ...args);
        }
    }

    warn(...args: any[]) {
        if (this.shouldLog()) {
            console.warn('[Kiado WARN]', ...args);
        }
    }

    error(...args: any[]) {
        // Always log errors, but consider sending to error tracking service in production
        console.error('[Kiado ERROR]', ...args);
        // TODO: Send to Sentry or other error tracking service in production
    }

    debug(...args: any[]) {
        if (this.shouldLog()) {
            console.debug('[Kiado DEBUG]', ...args);
        }
    }
}

export const logger = new Logger();
