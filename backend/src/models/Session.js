import { Schema, model } from 'mongoose';

const sessionSchema = new Schema({
  tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
  status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE', required: true },
  totalAmount: { type: Number, required: true, default: 0 },
  closedAt: { type: Date }
}, { timestamps: true });

sessionSchema.index(
  { tableId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);

export const Session = model('Session', sessionSchema);
