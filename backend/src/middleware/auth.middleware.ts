import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../lib/utils";

//extend express request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
    try {
        //get token from cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Authorization required, Please login' });
        }

        //verify token
        const decoded = verifyToken(token);
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

//role based authorization middleware
export const suthorizeRoles = (...allowedRoles: number[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if(!req.user) {
            return res.status(401).json({ message: 'Authorization required, Please login' });
        }

        if (!allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({ error: 'Access denied: You do not have permission to access this resource' });
        }
        next();
    };
};