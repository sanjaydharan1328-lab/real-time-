import Document from "../models/Document.js";
import DocumentHistory from "../models/DocumentHistory.js";
import User from "../models/User.js";
import { findAccessibleDocument, persistContent, recordTransition } from "../services/documentService.js";
import { httpError } from "../middleware/errorHandler.js";
import { isValidDocumentTitle } from "../utils/validators.js";
import { DocumentDfa } from "../automata/documentDfa.js";

export async function listDocuments(req, res) {
  const docs = await Document.find({ $or: [{ owner: req.user._id }, { collaborators: req.user._id }] })
    .sort({ updatedAt: -1 }).populate("owner", "username").populate("lockedBy", "username");
  res.json({ documents: docs });
}

export async function createDocument(req, res) {
  const title = req.body.title?.trim();
  if (!isValidDocumentTitle(title || "")) throw httpError(400, "Title must be 1–100 characters and cannot contain control characters or angle brackets");
  const dfa = new DocumentDfa();
  const transitions = [dfa.transition("START_EDIT"), dfa.transition("SAVE"), dfa.transition("SAVE_SUCCESS")];
  const document = await Document.create({ title, owner: req.user._id, currentState: dfa.currentState });
  await DocumentHistory.insertMany(transitions.map((transition) => ({ documentId: document._id, userId: req.user._id, action: transition.input, previousState: transition.from, newState: transition.to })));
  res.status(201).json({ document });
}

export async function getDocument(req, res) {
  const document = await findAccessibleDocument(req.params.id, req.user._id);
  res.json({ document });
}

export async function updateDocument(req, res) {
  const document = await findAccessibleDocument(req.params.id, req.user._id);
  if (req.body.title !== undefined) {
    if (String(document.owner._id) !== String(req.user._id)) throw httpError(403, "Only the owner can rename this document");
    if (!isValidDocumentTitle(req.body.title.trim())) throw httpError(400, "Document title is invalid");
    document.title = req.body.title.trim();
    await document.save();
  }
  if (req.body.content !== undefined) {
    const result = await persistContent(document, req.user._id, req.body.content);
    req.app.get("io").to(`document:${document.id}`).emit("document-update", { documentId: document.id, content: document.content, updatedAt: document.updatedAt, user: { id: req.user.id, username: req.user.username } });
    req.app.get("io").to(`document:${document.id}`).emit("document-saved", { documentId: document.id, savedAt: document.updatedAt, user: { id: req.user.id, username: req.user.username } });
    req.app.get("io").to(`document:${document.id}`).emit("state-updated", { documentId: document.id, state: document.currentState, transitions: result.transitions });
  }
  res.json({ document });
}

export async function deleteDocument(req, res) {
  const document = await findAccessibleDocument(req.params.id, req.user._id);
  if (String(document.owner._id) !== String(req.user._id)) throw httpError(403, "Only the owner can delete this document");
  await Promise.all([document.deleteOne(), DocumentHistory.deleteMany({ documentId: document._id })]);
  res.status(204).end();
}

export async function changeLock(req, res) {
  const document = await findAccessibleDocument(req.params.id, req.user._id);
  const lock = req.body.lock;
  if (typeof lock !== "boolean") throw httpError(400, "lock must be true or false");
  if (lock) {
    if (document.isLocked) throw httpError(423, "Document is already locked");
    const transition = await recordTransition(document, req.user._id, "LOCK");
    const event = { documentId: document.id, state: document.currentState, isLocked: true, lockedBy: { id: req.user.id, username: req.user.username }, transition };
    req.app.get("io").to(`document:${document.id}`).emit("document-locked", event);
    req.app.get("io").to(`document:${document.id}`).emit("state-updated", event);
    return res.json({ document, transition });
  }
  if (!document.isLocked || String(document.lockedBy?._id || document.lockedBy) !== String(req.user._id)) throw httpError(403, "Only the lock owner can unlock this document");
  const transition = await recordTransition(document, req.user._id, "UNLOCK");
  const event = { documentId: document.id, state: document.currentState, isLocked: false, transition };
  req.app.get("io").to(`document:${document.id}`).emit("document-unlocked", event);
  req.app.get("io").to(`document:${document.id}`).emit("state-updated", event);
  res.json({ document, transition });
}

export async function shareDocument(req, res) {
  const document = await findAccessibleDocument(req.params.id, req.user._id);
  if (String(document.owner._id) !== String(req.user._id)) throw httpError(403, "Only the owner can share this document");
  const email = String(req.body.email || "").trim().toLowerCase();
  const collaborator = await User.findOne({ email }).select("username email");
  if (!collaborator) throw httpError(404, "No user exists with that email");
  if (String(collaborator._id) === String(req.user._id)) throw httpError(400, "The owner already has access");
  if (!document.collaborators.some((u) => String(u._id) === String(collaborator._id))) {
    document.collaborators.push(collaborator._id);
    await document.save();
  }
  res.json({ document, collaborator });
}

export async function getHistory(req, res) {
  const document = await findAccessibleDocument(req.params.id, req.user._id);
  const history = await DocumentHistory.find({ documentId: document._id }).sort({ timestamp: -1 }).limit(200).populate("userId", "username");
  res.json({ history });
}
