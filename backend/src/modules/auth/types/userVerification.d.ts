export interface EmailVerification {
    id?: number;
    user_id: number;
    code: string;
    expires_at: Date;
    used_at?: Date;
}