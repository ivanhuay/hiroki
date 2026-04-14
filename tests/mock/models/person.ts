import mongoose, { Document, Schema } from 'mongoose';

export interface IPerson extends Document {
  title: string;
  tag: string[];
}

const PersonSchema = new Schema<IPerson>({
  title: {
    type: String,
    required: true
  },
  tag: [String]
});

const Person = mongoose.model<IPerson>('Person', PersonSchema);
export default Person;
