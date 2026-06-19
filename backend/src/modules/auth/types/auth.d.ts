// export interface SignupBody {
//     ifullname: string;
//     iusername?: string;
//     iemail: string;
//     ipassword: string;
//     irole: 'candidate' | 'employer';
// }
export interface SignupBody {
    ifirstname: string;
    ilastname: string;
    iusername?: string;
    iemail: string;
    ipassword: string;
    idateOfBirth: string;
}

export interface LoginBody {
    iemail: string;
    ipassword: string;
}

// Add/replace in types/auth.ts

export interface VerifyResetOtpBody {
    email: string;
    code: string;
}

export interface ResetPasswordBody {
    token?: string;        // long-lived hex link from the email (?token=...)
    sessionToken?: string; // short-lived token issued after OTP verification
    inewPassword: string;
    iconfirmPassword: string;
}

// NOTE: renamed from `resetPasswordBody` (lowercase) to `ResetPasswordBody` for
// convention consistency — update the import in auth.controller.ts accordingly,
// or keep the old name as an alias if you'd rather not touch other call sites:
// export type resetPasswordBody = ResetPasswordBody;


