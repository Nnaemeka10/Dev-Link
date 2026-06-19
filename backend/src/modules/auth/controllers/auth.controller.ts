import { Request, Response } from 'express';
import { UserModel } from '../models/User.js';
import type { LoginBody, ResetPasswordBody, SignupBody } from '../types/auth.js';
import { generateToken } from '../../../lib/utils.js';
import { EmailVerificationModel } from '../models/userVerification.js';
import { PasswordResetModel } from '../models/passwordReset.js';
import { emailService } from '../../../emails/emailHandler.js';
import { User, UserWithoutPassword } from '../types/user.js';


//signup controller
export const signup = async (_req: Request<{}, {}, SignupBody>, res: Response) => {

    const {ifirstname, ilastname, iusername, iemail, ipassword, idateOfBirth} = _req.body;
    const firstname = typeof ifirstname === 'string' ? ifirstname.trim() : '';
    const lastName = typeof ilastname === 'string' ? ilastname.trim() : '';
    const username = typeof iusername === 'string' ? iusername.trim() : '';
    const email = typeof iemail === 'string' ? iemail.trim().toLowerCase() : '';
    const password = typeof ipassword === 'string' ? ipassword : '';
    const dateOfBirth = typeof idateOfBirth === 'string' ? new Date(idateOfBirth) : new Date();

    //validation

    //field presence
    if (!firstname || !lastName || !email || !password || !dateOfBirth) {
        res.status(400).json({ message: 'All fields are required.' });
        return;
    }

    //email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({ message: 'Invalid email format.' });
        return;
    }

    //password strength
    if (password.length < 6) {
        res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        return;
    }


    try {
        //check if user with email or username already exists
        const existingUserByEmail = await UserModel.findByEmail(email);
        if (existingUserByEmail) {
            if (existingUserByEmail.is_email_verified) {
                res.status(409).json({ message: 'User with this email already exists.' });
                return;
            }
            else {
                // generateToken({
                //     userId: existingUserByEmail.id!,
                //     email: existingUserByEmail.email,
                // }, res);  
                //if user exists but email not verified, resend verification email
                const verification = await EmailVerificationModel.create(existingUserByEmail.id!);
                try {
                    await emailService.sendVerificationEmail(existingUserByEmail.email, verification.code);
                } catch (emailError) {
                    console.error('Failed to send verification email:', emailError);
                    // dont fail signup if email fails
                }
                res.status(201).json({ 
                    message: 'User with this email already exists but is not verified, Verification email resent. Please verify your email to complete the signup process.',
                    // requiresVerification: true,
                    expiresAt: verification.expires_at, 
                });
                return;
            }
        }

        //create user
        const newUser = await UserModel.create({
            email,
            username,
            password,
            first_name: firstname,
            last_name: lastName,
            date_of_birth: dateOfBirth.toISOString().split('T')[0], //store only date part
        });

        
        if (newUser) {
            //generate token
            // generateToken({
            //     userId: user.id!,
            //     email: user.email,
            //     role_id: user.role_id,
            // }, res
            // );
            // generateToken({
            //     userId: newUser.id!,
            //     email: newUser.email,
            // }, res);  
            
            const verification = await EmailVerificationModel.create(newUser.id!);
            //send verification email
            try {
                await emailService.sendVerificationEmail(newUser.email, verification.code);
            } catch (emailError) {
                console.error('Failed to send verificaton email:', emailError);
                //dont fail signup if eamil fails
            }

            // // remove password hash from response
            // const { password_hash, ...userWithoutPassword } = newUser;

            //send response
            // res.status(201).json({
            //     message: 'User created successfully.',
            //     user: userWithoutPassword,
            // });
            res.status(201).json({
                message: "A verification email has been sent to your email address. Please verify your email to complete the signup process.",
                expiresAt: verification.expires_at,
            })

            

        }else {
            res.status(400).json({ message: 'invalid user data.' });
        }
        
    } catch (error: any) {
        console.log("Error in signup controller:", error);
        // handle race condition for duplicate email/username
        // PostgreSQL duplicate key error handling
        if (error?.code === '23505') {  // PostgreSQL unique violation code
        // Check if it's an email constraint violation
        if (error?.constraint?.includes('email') || error?.detail?.includes('email')) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        // Check if it's a username constraint violation
        if (error?.constraint?.includes('username') || error?.detail?.includes('username')) {
            return res.status(409).json({ message: 'Username already exists' });
        }
        // Generic duplicate error
        return res.status(409).json({ message: 'Duplicate entry' });
    }
    return res.status(500).json({ message: 'Server error' });
    }   
};


//login controller
export const login = async (_req: Request<{}, {}, LoginBody>, res: Response) => {
    const { iemail, ipassword } = _req.body;
    const email = typeof iemail === 'string' ? iemail.trim().toLowerCase() : '';
    const password = typeof ipassword === 'string' ? ipassword : '';

    if(!email || !password) {
        res.status(400).json({ message: 'Email and password are required.' });
        return;
    }

    try{
        //find user by emaail
        const user = await UserModel.findByEmail(email);
        if(!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        //check if account is active
        if(!user.is_active) {
            res.status(403).json({ message: 'Account Otilo. Please contact support.' });
            return;
        }

        const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash!);
        if(!isPasswordValid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        if(!user.is_email_verified) {
            //generate verification code
            const verification = await EmailVerificationModel.create(user.id!);
            try {
                await emailService.sendVerificationEmail(user.email, verification.code);
            } catch (emailError) {
                console.error('Failed to send verification email:', emailError);
            }
            res.status(200).json({
                message: "Your email is not verified. A new verification email has been sent.",
                requiresVerification: true,
                expiresAt: verification.expires_at,
            });
            return;
        }

        //generate token and set cookie
        // generateToken({
        //     userId: user.id!,
        //     email: user.email,
        //     role_id: user.role_id,
        // }, res
        // );
        generateToken({
            userId: user.id!,
            email: user.email,
        }, res
        );
       

        // remove password hash from response
        const { password_hash, ...userWithoutPassword } = user as any;

        res.status(200).json({
            message: 'Login successful.',
            user: userWithoutPassword,
        });


    }catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//logout controller
// export const logout = async (_req: Request, res: Response) => {

//     try {
//         //clear the token cookei
//         res.clearCookie('token', {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'development' ? false : true,
//         });

//         res.status(200).json({ message: 'Logout successful' });
//     } catch (error: any) {
//         console.error('Logout error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };
export const logout = async (_req: Request, res: Response) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'development' ? "lax" : "none",
            secure: process.env.NODE_ENV !== 'development',
            path: "/",
        });

        return res.status(200).json({ message: 'Logout successful' });
    } catch (error: any) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

//get current authenticated user
export const getCurrentUser = async (_req: Request, res: Response) => {
    try {
        if (!_req.user) {
            return res.status(401).json({ message: 'Authorization required, Please login' });
        }

        const user = await UserModel.findById(_req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

       const userResponse = {
            id: user.id,
            email: user.email,
            username: user.username,
            headline: user.headline,
            firstName: user.first_name,
            lastName: user.last_name,
            dateOfBirth: user.date_of_birth,
            phone: user.phone,
            isEmailVerified: user.is_email_verified,
            isActive: user.is_active,
            };

            return res.status(200).json({
            user: userResponse,
        });
    } catch (error: any) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//send or resend verification email
export const sendVerificationEmail = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authorization required, Please login' });
        }

        const user = await UserModel.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.is_email_verified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        //check rate limiting
        const rateLimit = await EmailVerificationModel.canRequestNewCode(user.id!);
        if(!rateLimit.canRequest) {
            res.status(429).json({
                error: `Please wait ${rateLimit.waitTime} seconds before requesting a new code`,
                waitTime: rateLimit.waitTime
            });
            return;
        }

        //create verification code which will delete all old verification codes
        const verification = await EmailVerificationModel.create(user.id!);

        //send email
        await emailService.sendVerificationEmail(user.email, verification.code);

        res.status(200).json({ 
            message: 'Verification email sent successfully',
            email: user.email
        });

    } catch (error: any) {
        console.error('Send verification email error:', error);
        res.status(500).json({ error: 'Internal server error:  Failed to send verification email' });
    }
};


//verify email with code
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email: rawEmail, code: rawCode } = req.body;
        const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
        const code = typeof rawCode === 'string' ? rawCode.trim() : '';

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required' });
        }

        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({ error: 'Invalid code format' });
        }

        const user = await UserModel.findByEmail(email);
        if(!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if(user.is_email_verified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        //find valid verificatopn code
        const verification = await EmailVerificationModel.findValidCode(user.id!, code);

        if (!verification) {
            res.status(400).json({error: 'Invalid or expired verification code'})
            return;
        }

        //mark code as used
        await EmailVerificationModel.markAsUsed(verification.id!);

        //update Users email verification code
        await UserModel.update(user.id!, {is_email_verified: true});

        // //generate token and set cookie
        generateToken({
                userId: user.id!,
                email: user.email,
            }, res);  

        // //send welcome email asynchronously
        //     emailService.sendWelcomeEmail(
        //         user.email,
        //         user.full_name || user.username || 'Esteemed User'
        //     ).catch (error => {
        //         console.error('Failed to send welcome email:', error);
        //         //log but dont fail the signup
        //     });
        //send welcome email asynchronously
        emailService.sendWelcomeEmail(
            user.email,
            user.username || user.first_name || 'Esteemed User'
        ).catch (error => {
            console.error('Failed to send welcome email:', error);
            //log but dont fail the signup
        });

        const { password_hash, ...userWithoutPassword } = user as User;

        res.status(200).json ({
            message: 'Email verified successful',
            user: {...userWithoutPassword, is_email_verified: true}
        });
    } catch(error: any) {
        console.error('Verify email error:', error);
        res.status(500).json({error: 'Failed to verify  email'});
    }
};

//request Passwod reset
// export const forgotPassword = async (req: Request<{}, {}, { email: string }>, res: Response) => {
//     try {
//         const { email } = req.body;

//         if(!email) {
//             return res.status(400).json({ error: 'Email is required' });
//         }

//         const user = await UserModel.findByEmail(email);

//         //Always return success to prevent email enumeration
//         if(!user) {
//             res.status(200).json({
//                 message: 'If an account exist with this email, you will receive a password reset link'
//             });
//             return;
//         }

//         // Create reset token
//         const resetToken = await PasswordResetModel.create(user.id!);

//         //send reset email
//         await emailService.sendPasswordResetEmail(user.email, resetToken.token, resetToken.link);

//         res.status(200).json({
//             message: 'If an account exists with this email, you will receive a passwrod reset link'
//         });
//     } catch (error: any) {
//         console.error('Forgot password error:', error);
//         res.status(500).json({error: 'Failed to process password reset request'});
//     }
// };


// //reset password wih token
// export const resetPassword = async (req: Request<{}, {}, resetPasswordBody>, res: Response) => {
//      const { token, inewPassword, iconfirmPassword} = req.body;
//      const newPassword = typeof inewPassword === 'string' ? inewPassword : '';
//      const confirmPassword = typeof iconfirmPassword === 'string' ? iconfirmPassword : '';
    
//      try {   
//         if(!token || !newPassword || !confirmPassword) {
//            return res.status(400).json({error: 'All fields are required'});
//         }

//         if(newPassword !== confirmPassword) {
//             return res.status(400).json({error: 'Passwords do not match' });
//         }

//         if(newPassword.length < 6) {
//             return res.status(400).json({ error: 'Password must be at least 6 characters' });
//         }

//         //find valid tokens
//         const resetToken = await PasswordResetModel.findValidToken(token);

//         if(!resetToken) {
//             return res.status(400).json({ error: 'Invalid or expired reset token'});
//         }

//         //update password
//         const user = await UserModel.updatePassword(resetToken.user_id, newPassword);

//         if(!user) {
//             return res.status(404).json({error: 'User not found'});
//         }

//         //mark token as used 
//         await PasswordResetModel.markAsUsed(resetToken.id!);

//         //send confirmation email
//         await emailService.sendPasswordResetSuccessEmail(user.email);

//         return res.status(200).json({message: 'Password reset successfully'})
//     } catch (error: any) {
//         console.error('Reset password error:', error);
//         res.status(500).json({ error: 'Failed to reset password', details:error.message });
//     }
// };

// --- Add these imports at the top of auth.controller.ts (merge with existing) ---
// import { PasswordResetModel } from '../models/passwordReset.js';
// import { UserModel } from '../models/User.js';
// import { emailService } from '../../../emails/emailHandler.js';

// ============================================================================
// Request Passwod reset  (unchanged behaviour, included for context only)
// ============================================================================
export const forgotPassword = async (req: Request<{}, {}, { email: string }>, res: Response) => {
    try {
        const { email: rawEmail } = req.body;
        const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await UserModel.findByEmail(email);

        // Always return success to prevent email enumeration
        if (!user) {
            res.status(200).json({
                message: 'If an account exists with this email, you will receive a password reset code',
            });
            return;
        }

        // Create reset token (also rotates out any previous request for this user)
        const resetToken = await PasswordResetModel.create(user.id!);
       

        // send reset email (contains both the 6-digit code and the fallback link)
        await emailService.sendPasswordResetEmail(user.email, resetToken.token, resetToken.link);

        res.status(200).json({
            message: 'If an account exists with this email, you will receive a password reset code',
            // expiresAt lets the frontend start an accurate countdown in the OTP modal
            // even before the user has verified anything. Safe to expose: it's just a timestamp,
            // not the user's existence or the code itself.
            expiresAt: resetToken.expires_at,
        });
    } catch (error: any) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
};

// ============================================================================
// Verify the 6-digit OTP from the email -> exchange for a short-lived session token
// This is the endpoint the OTP modal calls. On success, the *session token*
// (not the OTP) is what's allowed to actually set a new password — so the
// OTP can't be replayed/reused against /reset-password directly, and a
// brute-forced or shoulder-surfed code is useless without also controlling
// the response of this exact request.
// ============================================================================
export const verifyResetOtp = async (req: Request<{}, {}, { email: string; code: string }>, res: Response) => {
    try {
        const { email: rawEmail, code: rawCode } = req.body;
        const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
        const code = typeof rawCode === 'string' ? rawCode.trim() : '';

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required' });
        }

        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({ error: 'Invalid code format' });
        }

        const user = await UserModel.findByEmail(email);

        // Generic error so we don't leak whether the email exists, separate from
        // whether the code is wrong — both render the same to the client.
        const genericError = { error: 'Invalid or expired code' };

        if (!user) {
            return res.status(400).json(genericError);
        }

        const resetRecord = await PasswordResetModel.findActiveByUserId(user.id!);

        if (!resetRecord) {
            return res.status(400).json(genericError);
        }

        if (PasswordResetModel.isLocked(resetRecord)) {
            return res.status(429).json({
                error: 'Too many attempts. Please request a new code.',
                lockedUntil: resetRecord.locked_until,
            });
        }

        if (resetRecord.token !== code) {
            const { attempts, lockedUntil } = await PasswordResetModel.recordFailedAttempt(resetRecord.id);
            const remaining = Math.max(PasswordResetModel.constants.MAX_ATTEMPTS - attempts, 0);

            if (lockedUntil) {
                return res.status(429).json({
                    error: 'Too many attempts. Please request a new code.',
                    lockedUntil,
                });
            }

            return res.status(400).json({
                error: 'Incorrect code',
                attemptsRemaining: remaining,
            });
        }

        // Code is correct -> issue a short-lived session token for the set-new-password step
        const { sessionToken, sessionExpiresAt } = await PasswordResetModel.markVerifiedAndIssueSession(resetRecord.id);

        return res.status(200).json({
            message: 'Code verified',
            sessionToken,
            sessionExpiresAt,
        });
    } catch (error: any) {
        console.error('Verify reset OTP error:', error);
        res.status(500).json({ error: 'Failed to verify code' });
    }
};

// ============================================================================
// reset password with either:
//   - sessionToken  (issued after OTP verification via the modal), or
//   - token         (the long-lived hex link from the email, ?token=...)
// ============================================================================
export const resetPassword = async (req: Request<{}, {}, ResetPasswordBody>, res: Response) => {
    const { token, sessionToken, inewPassword, iconfirmPassword } = req.body;
    const newPassword = typeof inewPassword === 'string' ? inewPassword : '';
    const confirmPassword = typeof iconfirmPassword === 'string' ? iconfirmPassword : '';

    try {
        if ((!token && !sessionToken) || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Resolve the reset record from whichever proof-of-identity was supplied
        const resetToken = sessionToken
            ? await PasswordResetModel.findBySessionToken(sessionToken)
            : await PasswordResetModel.findValidToken(token!);

        if (!resetToken) {
            return res.status(400).json({ error: 'Invalid or expired reset session. Please request a new code.' });
        }

        // update password
        const user = await UserModel.updatePassword(resetToken.user_id, newPassword);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // mark token as used (terminal — both the OTP and the email link are now dead)
        await PasswordResetModel.markAsUsed(resetToken.id!);

        // send confirmation email
        await emailService.sendPasswordResetSuccessEmail(user.email);

        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error: any) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password', details: error.message });
    }
};