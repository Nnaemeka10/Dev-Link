import jwt from 'jsonwebtoken';
import { ENV } from './env.js';
import { getDB } from './db.js';

export interface JwtPayload {
    userId: number;
    email: string;
    token_version?: number;
}

//generate JWT token
export const generateToken = async (payLoad: JwtPayload, res: any): Promise<string> => {
    //authentiate user using JWT
    const {JWT_SECRET, NODE_ENV} = ENV;

    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // look up the user's CURRENT token_version and embed it in the
    // token, so verifyToken can reject stale tokens after a password reset/change.
    const db = getDB();
    const { rows } = await db.query(
        'SELECT token_version FROM users WHERE id = $1',
        [payLoad.userId]
    );

    if (rows.length === 0) {
        throw new Error('User not found while generating token');
    }

    const token_version = Number(rows[0].token_version ?? 0);

    const token = jwt.sign({ ...payLoad, token_version }, JWT_SECRET, {
        expiresIn: '7d', //token valid for 7 days
    });

    //send the token back as a cookie
    res.cookie('token', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
        httpOnly: true, //accessible only by web server
        sameSite: NODE_ENV === 'development' ? "lax" : "none", //CSRF protection
        secure: NODE_ENV === 'development' ? false : true, //cookie only sent over HTTPS in production
        path: '/', //cookie available in entire website
    });

    return token;
}

//verify JWT token
export const verifyToken = async (token: string): Promise<JwtPayload | null> => {
    try{
        const {JWT_SECRET} = ENV;
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // session revocation check. The token must carry the
        // user's CURRENT token_version, otherwise it was issued before a
        // password reset/change and must be rejected 
        const db = getDB();
        const { rows } = await db.query(
            'SELECT token_version FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (rows.length === 0) {
            // user no longer exists & session is dead
            return null;
        }

        const currentVersion = Number(rows[0].token_version ?? 0);
        const tokenVersion = Number(decoded.token_version ?? 0);

        if (tokenVersion !== currentVersion) {
            console.warn(`Stale token rejected for user ${decoded.userId}: token version ${tokenVersion}, current version ${currentVersion}`);
            return null;
        }

        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};