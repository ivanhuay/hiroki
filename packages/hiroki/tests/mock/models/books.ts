import mongoose, { Document, Schema } from 'mongoose';

export interface IBook extends Document {
  title: string;
  tag: string[];
  tagCount?: number;
}

const BooksSchema = new Schema<IBook>({
  title: {
    type: String,
    required: true
  },
  tag: [String],
  tagCount: Number
});

BooksSchema.pre('save', function(next) {
  if (this.isModified('tag')) {
    this.tagCount = this.tag.length;
  }
  next();
});

const Books = mongoose.model<IBook>('Books', BooksSchema);
export default Books;
