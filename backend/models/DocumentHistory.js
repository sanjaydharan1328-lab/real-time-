import mongoose from "mongoose";
import { DOCUMENT_STATES } from "../automata/documentDfa.js";

const historySchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  previousState: { type: String, enum: Object.values(DOCUMENT_STATES), required: true },
  newState: { type: String, enum: Object.values(DOCUMENT_STATES), required: true },
}, { timestamps: { createdAt: "timestamp", updatedAt: false } });

export default mongoose.model("DocumentHistory", historySchema);
