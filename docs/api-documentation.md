# REST API documentation

All routes except health, registration and login require `Authorization: Bearer <JWT>`. JSON request bodies use `Content-Type: application/json`. Errors are JSON `{ "message": "..." }`. Document routes return 404 if the caller is not a member, preventing private document enumeration.

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/api/health` | — | `{ status: "ok" }` |
| POST | `/api/auth/register` | `{ username, email, password }` | 201 with token and user |
| POST | `/api/auth/login` | `{ email, password }` | token and user |
| GET | `/api/auth/me` | — | current profile |
| GET | `/api/documents` | — | accessible document list |
| POST | `/api/documents` | `{ title }` | 201 created document |
| GET | `/api/documents/:id` | — | authorized document |
| PUT | `/api/documents/:id` | `{ title?, content? }` | updated document after any content persistence |
| DELETE | `/api/documents/:id` | — | 204; owner only |
| POST | `/api/documents/:id/share` | `{ email }` | updated collaborators; owner only |
| PATCH | `/api/documents/:id/lock` | `{ lock: true\|false }` | state transition; unlock restricted to owner of lock |
| GET | `/api/documents/:id/history` | — | up to 200 recent history records |
| POST | `/api/automata/transition` | `{ state, input, history?, rejected? }` | isolated backend DFA demonstration trace |
| GET | `/api/monitor/activity?limit=100` | — | observed in-memory HTTP/socket events, live sockets and rooms |

## Socket.IO protocol

Authenticate with `io(server, { auth: { token } })`. Join with `join-document({ documentId }, ack)`; the acknowledgement includes the authorized document and active collaborators. Emit `document-update({ documentId, content }, ack)` to persist text and broadcast the saved content, timestamp and DFA state. Lock/unlock events use `{ documentId }` and acknowledge success or an error. `leave-document` leaves the room. The server broadcasts `user-joined`, `user-left`, `document-update`, `document-saved`, `document-locked`, `document-unlocked`, and `state-updated` to room members.

## Status codes

`400` invalid input, `401` missing/invalid authentication, `403` disallowed operation, `404` inaccessible/missing resource, `409` conflict/invalid workflow, `423` locked document, `422` rejected DFA demonstration transition, and `500` unexpected server error.
