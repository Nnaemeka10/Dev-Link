import { Request, Response } from 'express';
import { UserModel } from '../models/User.js';
import type { LoginBody, SignupBody, resetPasswordBody } from '../types/auth.d.ts';
import { generateToken } from '../lib/utils.js';
import { EmailVerificationModel } from '../models/userVerification.js';
import { PasswordResetModel } from '../models/passwordReset.js';
import { emailService } from '../emails/emailHandler.js';


//signup controller
export const signup = async (_req: Request<{}, {}, SignupBody>, res: Response) => {

    const {ifullname, iusername, iemail, ipassword, irole} = _req.body;
    const fullname = typeof ifullname === 'string' ? ifullname.trim() : '';
    const username = typeof iusername === 'string' ? iusername.trim() : '';
    const email = typeof iemail === 'string' ? iemail.trim().toLowerCase() : '';
    const password = typeof ipassword === 'string' ? ipassword : '';
    const role = typeof irole === 'string' ? irole : '';

    //validation

    //field presence
    if (!fullname || !email || !password || !role) {
        res.status(400).json({ message: 'Full name, email, password, and role are required.' });
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
            res.status(409).json({ message: 'User with this email already exists.' });
            return;
        }

        if (username) {
            const existingUserByUsername = await UserModel.findByUsername(username);
            if (existingUserByUsername) {
                res.status(409).json({ message: 'User with this username already exists.' });
                return;
            }
        }

        //map role to role_id (1: candidate, 2: employer 3: admin)
        const roleMap: Record<string, number> = {
            candidate: 1,
            employer: 2,
            admin: 3,
        };

        //create user
        const newUser = await UserModel.create({
            email,
            username,
            password,
            full_name: fullname,
            role_id: roleMap[role] || 1,
        });

        
        if (newUser) {
            //generate token
            generateToken({
                userId: newUser.id!,
                email: newUser.email,
                role_id: newUser.role_id,
            }, res);  
            
            //send verification email
            try {
                const verification = await EmailVerificationModel.create(newUser.id!);
                await emailService.sendVerificationEmail(newUser.email, verification.code);
            } catch (emailError) {
                console.error('Failed to send verificaton email:', emailError);
                //dont fail signup if eamil fails
            }

            // remove password hash from response
            const { password_hash, ...userWithoutPassword } = newUser as any;

            //send response
            res.status(201).json({
                message: 'User created successfully.',
                user: userWithoutPassword,
            });

            

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

        //generate token and set cookie
        generateToken({
            userId: user.id!,
            email: user.email,
            role_id: user.role_id,
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
export const logout = async (_req: Request, res: Response) => {

    try {
        //clear the token cookei
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development' ? false : true,
        });

        res.status(200).json({ message: 'Logout successful' });
    } catch (error: any) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
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

        // remove password hash from response
        const { password_hash, ...userWithoutPassword } = user as any;

        res.status(200).json({
            user: userWithoutPassword,
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
        const { code } = req.body;

        if(!req.user) {
            return res.status(401).json({ error: 'Authorization required, Please login' });
        }

        if(!code) {
            return res.status(400).json({ error: 'Verification code is required' });
        }

        const user = await UserModel.findById(req.user.userId);
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

        //send welcome email asynchronously
            emailService.sendWelcomeEmail(
                user.email,
                user.full_name || user.username || 'Esteemed User'
            ).catch (error => {
                console.error('Failed to send welcome email:', error);
                //log but dont fail the signup
            });

        res.status(200).json ({
            message: 'Email verified successful',
            user: {...user, is_email_verified: true}
        });
    } catch(error: any) {
        console.error('Verify email error:', error);
        res.status(500).json({error: 'Failed to verify  email'});
    }
};

//request Passwod reset
export const forgotPassword = async (req: Request<{}, {}, { email: string }>, res: Response) => {
    try {
        const { email } = req.body;

        if(!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await UserModel.findByEmail(email);

        //Always return success to prevent email enumeration
        if(!user) {
            res.status(200).json({
                message: 'If an account exist with this email, you will receive a password reset link'
            });
            return;
        }

        // Create reset token
        const resetToken = await PasswordResetModel.create(user.id!);

        //send reset email
        await emailService.sendPasswordResetEmail(user.email, resetToken.token);

        res.status(200).json({
            message: 'If an account exists with this email, you will receive a passwrod reset link'
        });
    } catch (error: any) {
        console.error('Forgot password error:', error);
        res.status(500).json({error: 'Failed to process password reset request'});
    }
};


//reset password wih token
export const resetPassword = async (req: Request<{}, {}, resetPasswordBody>, res: Response) => {
     const { token, inewPassword, iconfirmPassword} = req.body;
     const newPassword = typeof inewPassword === 'string' ? inewPassword : '';
     const confirmPassword = typeof iconfirmPassword === 'string' ? iconfirmPassword : '';
    
     try {   
        if(!token || !newPassword || !confirmPassword) {
           return res.status(400).json({error: 'All fields are required'});
        }

        if(newPassword !== confirmPassword) {
            return res.status(400).json({error: 'Passwords do not match' });
        }

        if(newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        //find valid tokens
        const resetToken = await PasswordResetModel.findValidToken(token);

        if(!resetToken) {
            return res.status(400).json({ error: 'Invalid or expired reset token'});
        }

        //update password
        const user = await UserModel.updatePassword(resetToken.user_id, newPassword);

        if(!user) {
            return res.status(404).json({error: 'User not found'});
        }

        //mark token as used 
        await PasswordResetModel.markAsUsed(resetToken.id!);

        //send confirmation email
        await emailService.sendPasswordResetSuccessEmail(user.email);

        return res.status(200).json({message: 'Password reset successfully'})
    } catch (error: any) {
        console.error('Rest password error:, error');
        res.status(500).json({ error: 'Failed to reset password'});
    }
};
