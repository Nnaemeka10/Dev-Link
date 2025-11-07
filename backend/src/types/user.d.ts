export interface User {
    id?: number;
    role_id: number;
    email: string;
    username?: string;
    password_hash?: string;
    full_name?: string;
    headline?: string;
    phone?: string;
    is_email_verified?: boolean;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateUserInput {
    email: string;
    username?: string;
    password: string;
    full_name?: string;
    role_id: number;
    headline?: string;
    phone?: string;
}