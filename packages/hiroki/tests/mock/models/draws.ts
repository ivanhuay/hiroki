import mongoose, { Document, Schema } from 'mongoose';

export interface IDraw extends Document {
  name: string;
  type?: string;
}

const DrawsSchema = new Schema<IDraw>({
  name: String,
  type: String
});

DrawsSchema.pre('save', function(next) {
  if (!this.type) {
    this.type = 'default-type';
  }
  next();
});

const Draws = mongoose.model<IDraw>('Draws', DrawsSchema);
export default Draws;
