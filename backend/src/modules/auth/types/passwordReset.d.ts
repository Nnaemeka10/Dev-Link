// export interface PasswordResetToken {
//     id?: number;
//     user_id: number;
//     token: string;
//     link: string;
//     expires_at: Date;
//     used_at?: Date;
// }

export interface PasswordResetToken {
    id: number;
    user_id: number;
    token: string;
    link: string;
    expires_at: Date;
    used_at: Date | null;

    // OTP verification -> session exchange
    session_token: string | null;
    session_expires_at: Date | null;
    verified_at: Date | null;
    attempts: number;
    locked_until: Date | null;
}