import mongoose, { Document, Schema } from 'mongoose';

export interface IBird extends Document {
  name: string;
  type: string;
}

const BirdsSchema = new Schema<IBird>({
  name: String,
  type: String
});

const Birds = mongoose.model<IBird>('Birds', BirdsSchema);
export default Birds;
