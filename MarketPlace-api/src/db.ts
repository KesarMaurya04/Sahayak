import mongoose from 'mongoose';
import { config } from './config';

export async function connectDB(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  return mongoose.connect(config.mongoUri);
}