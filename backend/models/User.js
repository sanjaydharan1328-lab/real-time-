import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 24, match: /^[A-Za-z0-9_]+$/ },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/ },
  passwordHash: { type: String, required: true, select: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model("User", userSchema);
