import { Schema, model, models, InferSchemaType } from 'mongoose';

const PaymentIntentSchema = new Schema({
  //bookingId: { type: String, index: true, required: true, unique: true },
  bookingId: {
    type: String,
    index: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    required: function (this: any) {
      return this.type === 'service';
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unique: function (this: any) {
      return this.type === 'service';
    },
  },

  providerId: { type: String, index: true, required: true },
  amountExpected: { type: Number, required: true },
  currency: { type: String, default: 'BOB' },
  paymentReference: { type: String, index: true, required: true }, // p.ej. SV-8F3K1
  status: {
    type: String,
    enum: ['pending', 'under_review', 'confirmed', 'rejected', 'expired'],
    default: 'pending',
  },
  deadlineAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['service', 'wallet'],
    default: 'service',
  },

  // Aquí agregas el nuevo campo 'method' para distinguir si la recarga se iso mediante QR o transferencia
  method: {
    type: String,
    enum: ['qr', 'transfer', 'card'],
    default: 'qr',
  },
  //
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

export type PaymentIntent = InferSchemaType<typeof PaymentIntentSchema>;
export default models.PaymentIntent || model('PaymentIntent', PaymentIntentSchema);