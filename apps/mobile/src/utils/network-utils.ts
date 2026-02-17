/**
 * Network Utilities
 * Handles offline detection and network error handling
 */

import NetInfo from '@react-native-community/netinfo';
import { logger } from './logger';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

let currentNetworkState: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  type: 'unknown',
};

// Subscribe to network state changes
export function initNetworkMonitoring() {
  const unsubscribe = NetInfo.addEventListener(state => {
    currentNetworkState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type,
    };

    logger.info('Network state changed:', currentNetworkState);
  });

  return unsubscribe;
}

// Get current network state
export async function getNetworkState(): Promise<NetworkState> {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable ?? false,
    type: state.type,
  };
}

// Check if device is online
export function isOnline(): boolean {
  return currentNetworkState.isConnected && currentNetworkState.isInternetReachable;
}

// Network error messages
export const NetworkErrors = {
  OFFLINE: 'No internet connection. Please check your network settings.',
  TIMEOUT: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

// Check if error is a network error
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  const errorString = error.toString().toLowerCase();
  const errorMessage = error.message?.toLowerCase() || '';

  return (
    errorString.includes('network') ||
    errorString.includes('connection') ||
    errorString.includes('timeout') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT'
  );
}

// Get user-friendly error message
export function getErrorMessage(error: any): string {
  if (!isOnline()) {
    return NetworkErrors.OFFLINE;
  }

  if (isNetworkError(error)) {
    return NetworkErrors.TIMEOUT;
  }

  if (error?.response?.status >= 500) {
    return NetworkErrors.SERVER_ERROR;
  }

  if (error?.message) {
    return error.message;
  }

  return NetworkErrors.UNKNOWN;
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if offline or not a network error
      if (!isOnline() || !isNetworkError(error)) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        logger.info(`Retrying request in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Wrap async function with offline check
export function withOfflineCheck<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: any[]) => {
    if (!isOnline()) {
      throw new Error(NetworkErrors.OFFLINE);
    }
    return fn(...args);
  }) as T;
}
