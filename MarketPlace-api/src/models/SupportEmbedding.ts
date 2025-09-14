import { Schema, model, InferSchemaType } from 'mongoose';

const SupportEmbeddingSchema = new Schema({
  articleId: { type: Schema.Types.ObjectId, ref: 'SupportArticle', index: true, required: true },
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true } // vector
}, { timestamps: true });

SupportEmbeddingSchema.index({ articleId: 1, chunkIndex: 1 }, { unique: true });

export type SupportEmbeddingDoc = InferSchemaType<typeof SupportEmbeddingSchema>;
export const SupportEmbedding = model<SupportEmbeddingDoc>('SupportEmbedding', SupportEmbeddingSchema);