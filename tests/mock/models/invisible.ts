import mongoose, { Document, Schema } from 'mongoose';

export interface IInvisible extends Document {
  name: string;
  content: string;
}

const InvisibleSchema = new Schema<IInvisible>({
  name: String,
  content: String
});

const Invisible = mongoose.model<IInvisible>('Invisible', InvisibleSchema);
export default Invisible;
