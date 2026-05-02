import mongoose, { Document, Schema } from 'mongoose';

export interface IItem extends Document {
  name: string;
  content: string;
}

const ItemSchema = new Schema<IItem>({
  name: String,
  content: String
});

const Item = mongoose.model<IItem>('Item', ItemSchema);
export default Item;
