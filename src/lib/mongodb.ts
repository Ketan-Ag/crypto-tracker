import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: null | typeof mongoose;
    promise: null | Promise<typeof mongoose>;
  } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-db';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const cached = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

async function connectDB() {
  return await mongoose.connect(MONGODB_URI);
}

export default connectDB; 