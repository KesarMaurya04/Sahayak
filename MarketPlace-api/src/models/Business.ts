import { Schema, model, InferSchemaType } from 'mongoose';

const HoursSchema = new Schema({
  day: { type: Number, min: 0, max: 6, required: true },
  open: { type: String },  // "09:00"
  close: { type: String }  // "18:00"
}, { _id: false });

const BusinessSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  description: String,
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
  },
  address: String,
  phone: String,
  hours: [HoursSchema]
}, { timestamps: true });

export type BusinessDoc = InferSchemaType<typeof BusinessSchema>;
export const Business = model<BusinessDoc>('Business', BusinessSchema);