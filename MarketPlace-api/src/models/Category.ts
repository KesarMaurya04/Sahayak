import { Schema, model, InferSchemaType } from 'mongoose';

const AttributeSchema = new Schema({
  key: { type: String, required: true, trim: true },             // e.g., "durationMinutes", "priceUnit"
  type: { type: String, enum: ['string','number','boolean','enum'], required: true },
  required: { type: Boolean, default: false },
  options: [{ type: String }]                                    // for enum types
}, { _id: false });

const CategorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  path: [{ type: Schema.Types.ObjectId, ref: 'Category' }],      // ancestors for quick filtering
  attributes: [AttributeSchema],
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

CategorySchema.index({ name: 'text' });

export type CategoryDoc = InferSchemaType<typeof CategorySchema>;
export const Category = model<CategoryDoc>('Category', CategorySchema);