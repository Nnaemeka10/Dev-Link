import { Request, Response } from 'express';

export const getListings = async (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Listings fetched successfully"
    });
  console.log("Received request for listings");
}