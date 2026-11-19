import mongoose from "mongoose";
import Document from "../models/Document.js";
import DocumentHistory from "../models/DocumentHistory.js";
import { DocumentDfa, DOCUMENT_STATES } from "../automata/documentDfa.js";
import { httpError } from "../middleware/errorHandler.js";

export async function findAccessibleDocument(documentId, userId) {
  if (!mongoose.isValidObjectId(documentId)) throw httpError(404, "Document not found");
  const document = await Document.findOne({ _id: documentId, $or: [{ owner: userId }, { collaborators: userId }] })
    .populate("owner", "username email")
    .populate("collaborators", "username email")
    .populate("lockedBy", "username");
  if (!document) throw httpError(404, "Document not found");
  return document;
}

export async function recordTransition(document, userId, input, action = input) {
  const previousState = document.currentState;
  const dfa = new DocumentDfa(previousState);
  let transition;
  try { transition = dfa.transition(input, { userId: String(userId) }); }
  catch (error) { throw httpError(409, error.message); }
  const filter = { _id: document._id, currentState: previousState };
  if (input === "LOCK") filter.isLocked = false;
  if (input === "UNLOCK") Object.assign(filter, { isLocked: true, lockedBy: userId });
  const isLocked = transition.to === DOCUMENT_STATES.LOCKED;
  const lockedBy = isLocked ? userId : null;
  const updated = await Document.findOneAndUpdate(filter, {
    $set: { currentState: transition.to, isLocked, lockedBy },
  }, { new: true, runValidators: true });
  if (!updated) throw httpError(409, "Document state changed; reload and try again");
  document.currentState = updated.currentState;
  document.isLocked = updated.isLocked;
  document.lockedBy = lockedBy;
  await DocumentHistory.create({ documentId: document._id, userId, action, previousState, newState: transition.to });
  return transition;
}

export async function persistContent(document, userId, content) {
  if (document.isLocked && String(document.lockedBy?._id || document.lockedBy) !== String(userId)) throw httpError(423, "Document is locked by another collaborator");
  if (typeof content !== "string" || content.length > 1_000_000) throw httpError(400, "Content must be text under 1 MB");

  const dfa = new DocumentDfa(document.currentState);
  const transitions = [];
  if (dfa.currentState === DOCUMENT_STATES.SAVED) transitions.push(dfa.transition("START_EDIT"));
  if (dfa.currentState === DOCUMENT_STATES.IDLE) transitions.push(dfa.transition("START_EDIT"));
  if (dfa.currentState === DOCUMENT_STATES.EDITING) transitions.push(dfa.transition("SAVE"));
  else if (dfa.currentState !== DOCUMENT_STATES.SAVING) throw httpError(409, "Document cannot be saved from its current state");
  document.currentState = dfa.currentState;
  document.content = content;
  try {
    await document.save();
  } catch (error) {
    const failure = dfa.transition("SAVE_FAILURE");
    document.currentState = failure.to;
    await document.save().catch(() => {});
    const failedHistory = transitions.concat(failure).map((t) => ({
      documentId: document._id, userId, action: t.input,
      previousState: t.from, newState: t.to,
    }));
    await DocumentHistory.insertMany(failedHistory).catch(() => {});
    throw error;
  }

  const success = dfa.transition("SAVE_SUCCESS");
  document.currentState = success.to;
  await document.save();
  const history = transitions.concat(success).map((t) => ({
    documentId: document._id, userId, action: t.input,
    previousState: t.from, newState: t.to,
  }));
  await DocumentHistory.insertMany(history).catch((error) => console.error("Document saved but history recording failed:", error.message));
  return { document, transitions: history };
}
