import { Request, Response } from 'express';
import { Portfolio } from '../models/portfolio.model';
import { bucket } from '../config/firebase.config';

export const createPortfolioItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'fixer') {
      return res.status(403).json({ message: 'Access denied. Only fixers can create portfolio items.' });
    }

    let url = '';
    if ((req as any).file) {
      const file = (req as any).file;
      const fileName = `portfolio/${Date.now()}-${Math.round(Math.random() * 1000)}-${file.originalname}`;
      const fileUpload = bucket.file(fileName);

      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      await new Promise<void>((resolve, reject) => {
        blobStream.on('error', (error: any) => reject(error));
        blobStream.on('finish', async () => {
          await fileUpload.makePublic();
          url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          resolve();
        });
        blobStream.end((req as any).file?.buffer);
      });
    }

    const portfolioData = {
      ...req.body,
      fixerId: user._id,
      url: url || req.body.url,
    };

    const portfolioItem = new Portfolio(portfolioData);
    await portfolioItem.save();
    res.status(201).json(portfolioItem);
  } catch (error) {
    res.status(400).json({ message: 'Error creating portfolio item', error });
  }
};

export const getPortfolioByFixerId = async (req: Request, res: Response) => {
  try {
    const { fixerId } = req.params;
    const portfolioItems = await Portfolio.find({ fixerId });
    res.status(200).json(portfolioItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching portfolio items', error });
  }
};

export const deletePortfolioItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const portfolioItem = await Portfolio.findByIdAndDelete(id);
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    res.status(200).json({ message: 'Portfolio item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting portfolio item', error });
  }
};

export const updatePortfolioItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const portfolioItem = await Portfolio.findByIdAndUpdate(id, req.body, { new: true });
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    res.status(200).json(portfolioItem);
  } catch (error) {
    res.status(400).json({ message: 'Error updating portfolio item', error });
  }
};
