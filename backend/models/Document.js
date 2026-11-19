import mongoose from "mongoose";
import { DOCUMENT_STATES } from "../automata/documentDfa.js";

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  content: { type: String, default: "", maxlength: 1_000_000 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  currentState: { type: String, enum: Object.values(DOCUMENT_STATES), default: DOCUMENT_STATES.SAVED },
  isLocked: { type: Boolean, default: false },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

documentSchema.index({ owner: 1, updatedAt: -1 });
export default mongoose.model("Document", documentSchema);
