import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import type { LoginBody, SignupBody } from '../types/auth.d.ts';
import { generateToken } from '../lib/utils';


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

            // remove password hash from response
            const { password_hash, ...userWithoutPassword } = newUser as any;

            res.status(201).json({
                message: 'User created successfully.',
                user: userWithoutPassword,
            });

            //send welcome email later

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


