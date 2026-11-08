import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../lib/utils.js";

//extend express request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //get token from cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Authorization required, Please login' });
        }

        //verify token (async: also checks users.token_version for revocation)
        const decoded = await verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid or expired token, Please login again' });
        }

        //atach user to request object
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};