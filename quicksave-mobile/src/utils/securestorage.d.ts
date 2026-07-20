export declare const SecureVault: {
    saveTokens(accessToken: string, refreshToken: string): Promise<void>;
    getAccessToken(): Promise<string | null>;
    getRefreshToken(): Promise<string | null>;
    clearTokens(): Promise<void>;
    setBiometricPreference(enabled: boolean): Promise<void>;
    getBiometricPreference(): Promise<boolean>;
};
//# sourceMappingURL=securestorage.d.ts.map