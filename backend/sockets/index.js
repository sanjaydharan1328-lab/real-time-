import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Document from "../models/Document.js";
import { findAccessibleDocument, persistContent, recordTransition } from "../services/documentService.js";
import { recordActivity } from "../services/activityLog.js";

const roomFor = (id) => `document:${id}`;
const userSummary = (user) => ({ id: String(user._id), username: user.username, email: user.email });

export function configureSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select("username email");
      if (!user) return next(new Error("Account no longer exists"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    recordActivity({ source: "socket", event: "connection", userId: String(socket.user._id), socketId: socket.id });

    socket.on("join-document", async (payload = {}, ack = () => {}) => {
      try {
        const document = await findAccessibleDocument(payload.documentId, socket.user._id);
        const room = roomFor(document.id);
        await socket.join(room);
        const collaborators = [...(io.sockets.adapter.rooms.get(room) || [])]
          .map((id) => io.sockets.sockets.get(id)?.user)
          .filter(Boolean).map(userSummary);
        socket.to(room).emit("user-joined", { user: userSummary(socket.user) });
        socket.emit("state-updated", { state: document.currentState, isLocked: document.isLocked, lockedBy: document.lockedBy });
        recordActivity({ source: "socket", event: "join-document", documentId: document.id, userId: String(socket.user._id) });
        ack({ ok: true, document, collaborators });
      } catch (error) { ack({ ok: false, message: error.message }); }
    });

    socket.on("leave-document", async (payload = {}, ack = () => {}) => {
      const room = roomFor(payload.documentId);
      await socket.leave(room);
      socket.to(room).emit("user-left", { userId: String(socket.user._id) });
      try {
        const document = await Document.findById(payload.documentId);
        if (document?.isLocked && String(document.lockedBy) === String(socket.user._id)) {
          const transition = await recordTransition(document, socket.user._id, "UNLOCK", "UNLOCK_ON_LEAVE");
          io.to(room).emit("document-unlocked", { documentId: document.id, state: transition.to, reason: "owner-left" });
          io.to(room).emit("state-updated", { documentId: document.id, state: transition.to });
        }
      } catch (error) { console.error("Socket leave cleanup failed:", error.message); }
      recordActivity({ source: "socket", event: "leave-document", documentId: payload.documentId, userId: String(socket.user._id) });
      ack({ ok: true });
    });

    socket.on("document-update", async (payload = {}, ack = () => {}) => {
      try {
        if (!socket.rooms.has(roomFor(payload.documentId))) throw Object.assign(new Error("Join this document room before editing"), { status: 403 });
        const document = await findAccessibleDocument(payload.documentId, socket.user._id);
        const result = await persistContent(document, socket.user._id, payload.content);
        const update = { documentId: document.id, content: document.content, updatedAt: document.updatedAt, user: userSummary(socket.user) };
        io.to(roomFor(document.id)).emit("document-update", update);
        io.to(roomFor(document.id)).emit("document-saved", { documentId: document.id, savedAt: document.updatedAt, user: userSummary(socket.user) });
        io.to(roomFor(document.id)).emit("state-updated", { state: document.currentState, transitions: result.transitions });
        recordActivity({ source: "socket", event: "document-update", documentId: document.id, userId: String(socket.user._id) });
        ack({ ok: true, savedAt: document.updatedAt, state: document.currentState });
      } catch (error) { ack({ ok: false, message: error.message }); }
    });

    socket.on("document-locked", async (payload = {}, ack = () => {}) => {
      try {
        if (!socket.rooms.has(roomFor(payload.documentId))) throw Object.assign(new Error("Join this document room before locking"), { status: 403 });
        const document = await findAccessibleDocument(payload.documentId, socket.user._id);
        if (document.isLocked) throw Object.assign(new Error("Document is already locked"), { status: 423 });
        const transition = await recordTransition(document, socket.user._id, "LOCK");
        const event = { documentId: document.id, state: document.currentState, lockedBy: userSummary(socket.user), transition };
        io.to(roomFor(document.id)).emit("document-locked", event);
        io.to(roomFor(document.id)).emit("state-updated", event);
        recordActivity({ source: "socket", event: "document-locked", documentId: document.id, userId: String(socket.user._id) });
        ack({ ok: true, ...event });
      } catch (error) { ack({ ok: false, message: error.message }); }
    });

    socket.on("document-unlocked", async (payload = {}, ack = () => {}) => {
      try {
        if (!socket.rooms.has(roomFor(payload.documentId))) throw Object.assign(new Error("Join this document room before unlocking"), { status: 403 });
        const document = await findAccessibleDocument(payload.documentId, socket.user._id);
        if (!document.isLocked || String(document.lockedBy?._id || document.lockedBy) !== String(socket.user._id)) throw Object.assign(new Error("Only the lock owner can unlock this document"), { status: 403 });
        const transition = await recordTransition(document, socket.user._id, "UNLOCK");
        const event = { documentId: document.id, state: document.currentState, transition };
        io.to(roomFor(document.id)).emit("document-unlocked", event);
        io.to(roomFor(document.id)).emit("state-updated", event);
        recordActivity({ source: "socket", event: "document-unlocked", documentId: document.id, userId: String(socket.user._id) });
        ack({ ok: true, ...event });
      } catch (error) { ack({ ok: false, message: error.message }); }
    });

    async function releaseLocksOnDisconnect() {
      for (const room of [...socket.rooms].filter((name) => name.startsWith("document:"))) {
        socket.to(room).emit("user-left", { userId: String(socket.user._id) });
      }
      try {
        const lockedDocuments = await Document.find({ isLocked: true, lockedBy: socket.user._id });
        for (const document of lockedDocuments) {
          const documentId = document.id;
          const room = roomFor(documentId);
          try {
            const transition = await recordTransition(document, socket.user._id, "UNLOCK", "UNLOCK_ON_DISCONNECT");
            io.to(room).emit("document-unlocked", { documentId, state: transition.to, reason: "owner-disconnected" });
            io.to(room).emit("state-updated", { documentId, state: transition.to });
          } catch (error) { console.error("Socket disconnect cleanup failed:", error.message); }
        }
      } catch (error) { console.error("Socket disconnect cleanup failed:", error.message); }
    }
    socket.on("disconnecting", releaseLocksOnDisconnect);
    socket.on("disconnect", (reason) => {
      recordActivity({ source: "socket", event: "disconnect", userId: String(socket.user._id), socketId: socket.id, reason });
    });
  });
}
