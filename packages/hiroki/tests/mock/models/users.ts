import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  role: string[];
  books: mongoose.Types.ObjectId[];
}

const UserSchema = new Schema<IUser>({
  name: String,
  email: String,
  role: [String],
  books: [{
    type: Schema.Types.ObjectId,
    ref: 'Books'
  }]
});

const Users = mongoose.model<IUser>('Users', UserSchema);
export default Users;
