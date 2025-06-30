export interface LoginCredentials {
    email: string;
    senha: string;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    error?: string;
}

export interface JWTPayload {
    userId: string;
    email: string;
    isAdmin: boolean;
} 