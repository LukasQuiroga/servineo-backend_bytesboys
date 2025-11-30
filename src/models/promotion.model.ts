import mongoose, { Schema, Document } from 'mongoose';

export interface IPromotion extends Document {
  title: string;
  description: string;
  price: number;
  offerId: string;
  fixerId: string;
  createdAt: Date;
}

const PromotionSchema = new Schema<IPromotion>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  offerId: { type: String, required: true },
  fixerId: { type: String, required: true },
  createdAt: { type: Date, required: true },
});

const Promotion = mongoose.model<IPromotion>('Promotion', PromotionSchema, 'promotions');
export default Promotion;
