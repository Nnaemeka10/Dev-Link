export interface PasswordResetToken {
    id?: number;
    user_id: number;
    token: string;
    expires_at: Date;
    used_at?: Date;
}