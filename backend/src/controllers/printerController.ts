import { Request, Response } from 'express';
import si from 'systeminformation';

export const getSystemPrinters = async (req: Request, res: Response) => {
  try {
    const printers = await si.printer();
    res.status(200).json({ printers });
  } catch (error) {
    console.error('Error fetching system printers:', error);
    res.status(500).json({
      message: 'Failed to fetch system printers',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
