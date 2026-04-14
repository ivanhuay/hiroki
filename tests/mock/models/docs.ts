import mongoose, { Document, Schema } from 'mongoose';

export interface IDoc extends Document {
  name: string;
  content: string;
}

const DocsSchema = new Schema<IDoc>({
  name: String,
  content: String
});

const Docs = mongoose.model<IDoc>('Docs', DocsSchema);
export default Docs;
