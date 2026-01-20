import AsyncStorage from "@react-native-async-storage/async-storage";
import {createClient} from "@supabase/supabase-js";
import {getRandomBytes} from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import {logger} from "@/utils/logger";

// Simple secure storage that works reliably with Expo
class LargeSecureStore {
    private generateKey(): string {
        // Use Expo's crypto for random bytes
        const bytes = getRandomBytes(32);
        return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
            ""
        );

    }
 
    private xorEncrypt(text: string, key: string): string {
        let result = "";
        for (let i = 0; i < text.length; i++) {
            const textChar = text.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            result += String.fromCharCode(textChar ^ keyChar);
        }
        // Convert to base64 for safe storage
        return btoa(result);
    }

    private xorDecrypt(encryptedText: string, key: string): string {
        // Decode from base64
        const decoded = atob(encryptedText);
        let result = "";
        for (let i = 0; i < decoded.length; i++) {
            const encryptedChar = decoded.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            result += String.fromCharCode(encryptedChar ^ keyChar);
        }
        return result;
    }

    async getItem(key: string): Promise<string | null> {
        try {
            const encrypted = await AsyncStorage.getItem(key);
            if (!encrypted) {
                return null;
            }

            // Get the encryption key from SecureStore
            const encryptionKey = await SecureStore.getItemAsync(`${key}_key`);
            if (!encryptionKey) {
                logger.warn("Encryption key not found, removing corrupted data");
                await this.removeItem(key);
                return null;
            }

            return this.xorDecrypt(encrypted, encryptionKey);
        } catch (error) {
            logger.error("Error decrypting stored value:", error);
            await this.removeItem(key);
            return null;
        }
    }

    async setItem(key: string, value: string): Promise<void> {
        try {
            // Generate a new encryption key for this item
            const encryptionKey = this.generateKey();

            // Store the key in SecureStore
            await SecureStore.setItemAsync(`${key}_key`, encryptionKey);

            // Encrypt and store the value in AsyncStorage
            const encrypted = this.xorEncrypt(value, encryptionKey);
            await AsyncStorage.setItem(key, encrypted);
        } catch (error) {
            logger.error("Error encrypting value:", error);
            throw error;
        }
    }

    async removeItem(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
            await SecureStore.deleteItemAsync(`${key}_key`);
        } catch (error) {
            logger.error("Error removing item:", error);
        }
    }
}

// Reading secrets from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
        "Missing Supabase environment variables. Please check your .env file."
    );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
        storage: new LargeSecureStore(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
