import jwt from 'jsonwebtoken';
import { ENV } from './env';

export interface JwtPayload {
    userId: number;
    email: string;
    role_id: number;
}

//generate JWT token
export const generateToken = (payLoad: JwtPayload, res: any) => {
    //authentiate user using JWT
    const {JWT_SECRET, NODE_ENV} = ENV;

    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign(payLoad, JWT_SECRET, {
        expiresIn: '7d', //token valid for 7 days
    });

    //send the token back as a cookie
    res.cookie('token', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
        httpOnly: true, //accessible only by web server
        sameSite: "strict", //CSRF protection
        secure: NODE_ENV === 'development' ? false : true, //cookie only sent over HTTPS in production
    });

    return token;
}

//verify JWT token
export const verifyToken = (token: string): JwtPayload | null => {
    try{
        const {JWT_SECRET} = ENV;
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};