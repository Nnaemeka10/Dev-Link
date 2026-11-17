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

/** GET /api/locations/states - the full state list for structured dropdowns. */
export const getStates = async (_req: Request, res: Response) => {
  try {
    const states = await LocationModel.listStates();
    // Reference data changes at most once a day (migration seed); let the
    // browser and any CDN hold it for a day and revalidate in the background.
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.status(200).json(states);
  } catch (error: any) {
    console.error('Get states error:', error);
    res.status(500).json({ message: 'Failed to fetch states' });
  }
};

/** GET /api/locations/states/:stateId/lgas - dependent LGA dropdown. */
export const getStateLgas = async (req: Request<{ stateId: string }>, res: Response) => {
  try {
    const { stateId } = req.params;
    if (!stateId || !/^[a-z0-9-]+$/.test(stateId)) {
      res.status(400).json({ message: 'Invalid state id' });
      return;
    }
    const exists = await LocationModel.stateExists(stateId);
    if (!exists) {
      res.status(404).json({ message: 'State not found' });
      return;
    }
    const lgas = await LocationModel.listLgas(stateId);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.status(200).json(lgas);
  } catch (error: any) {
    console.error('Get state LGAs error:', error);
    res.status(500).json({ message: 'Failed to fetch local governments' });
  }
};