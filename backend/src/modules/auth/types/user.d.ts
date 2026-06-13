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

// export interface UserWithoutPassword {
//     id?: number;
//     role_id: number;
//     email: string;
//     username?: string;
//     full_name?: string;
//     headline?: string;
//     phone?: string;
//     is_email_verified?: boolean;
//     is_active?: boolean;
//     created_at?: Date;
//     updated_at?: Date;
// }
export interface UserWithoutPassword {
    id?: number;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    headline?: string;
    phone?: string;
    is_email_verified?: boolean;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface AllowedUpdates {
    first_name?: string;
    last_name?: string;
    headline?: string;
    phone?: string;
    username?: string;
    is_email_verified?: boolean;
    is_active?: boolean;
}

// export interface CreateUserInput {
//     email: string;
//     username?: string;
//     password: string;
//     full_name?: string;
//     role_id: number;
//     headline?: string;
//     phone?: string;
// }

export interface CreateUserInput {
    email: string;
    username?: string;
    password: string;
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    headline?: string;
    phone?: string;
}