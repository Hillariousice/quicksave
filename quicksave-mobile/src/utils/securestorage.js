"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureVault = void 0;
const SecureStore = __importStar(require("expo-secure-store"));
// Strict hardware security options
const SECURE_OPTIONS = {
    // iOS: Token is only accessible when the device is unlocked. 
    // It will NOT be backed up to iCloud or transferred to a new device.
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
exports.SecureVault = {
    // --- TOKENS ---
    async saveTokens(accessToken, refreshToken) {
        await SecureStore.setItemAsync('accessToken', accessToken, SECURE_OPTIONS);
        await SecureStore.setItemAsync('refreshToken', refreshToken, SECURE_OPTIONS);
    },
    async getAccessToken() {
        return await SecureStore.getItemAsync('accessToken');
    },
    async getRefreshToken() {
        return await SecureStore.getItemAsync('refreshToken');
    },
    async clearTokens() {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
    },
    // --- BIOMETRICS PREFERENCE ---
    async setBiometricPreference(enabled) {
        await SecureStore.setItemAsync('biometricsEnabled', enabled ? 'true' : 'false', SECURE_OPTIONS);
    },
    async getBiometricPreference() {
        const value = await SecureStore.getItemAsync('biometricsEnabled');
        return value === 'true'; // Automatically parses to a boolean for you!
    }
};
//# sourceMappingURL=securestorage.js.map