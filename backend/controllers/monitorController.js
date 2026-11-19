import { recentActivity } from "../services/activityLog.js";

export function getActivity(req, res) {
  const io = req.app.get("io");
  res.json({
    events: recentActivity(req.query.limit),
    socket: { connectedClients: io.engine.clientsCount },
    rooms: [...io.sockets.adapter.rooms.entries()]
      .filter(([name]) => name.startsWith("document:"))
      .map(([name, sockets]) => ({ documentId: name.slice("document:".length), connectedUsers: sockets.size })),
  });
}
