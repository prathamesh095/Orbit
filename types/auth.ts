export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}

export interface Session {
    user: User;
    expiresAt: number; // Unix timestamp ms
}

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthError {
    field?: string;
    message: string;
}
