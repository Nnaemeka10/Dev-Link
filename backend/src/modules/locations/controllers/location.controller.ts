import { Request, Response } from 'express';
import { LocationModel } from '../models/Location.js';

const MIN_QUERY_LENGTH = 2;
const MAX_LIMIT = 12;

export const suggestLocations = async (req: Request, res: Response) => {
    try {
        const rawQuery = (req.query.q as string | undefined)?.trim();

        if (!rawQuery || rawQuery.length < MIN_QUERY_LENGTH) {
            res.status(200).json([]);
            return;
        }

        const limit = Math.min(
            parseInt(req.query.limit as string, 10) || 8,
            MAX_LIMIT
        );

        const suggestions = await LocationModel.suggest(rawQuery, limit);
        res.status(200).json(suggestions);
    } catch (error: any) {
        console.error('Location suggest error:', error);
        res.status(500).json({ message: 'Failed to fetch location suggestions' });
    }
};