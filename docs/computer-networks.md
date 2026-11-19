# Computer Networks integration

## Client-server architecture and protocols

The React browser is the client. It sends HTTP requests to the Express server using JSON REST endpoints. Express authenticates the JWT, authorizes access and uses Mongoose to read or write MongoDB. Socket.IO establishes an authenticated persistent connection for document rooms and presence. Its WebSocket transport carries frames over TCP; Socket.IO also provides connection management and fallback transports. The browser client and server use separate HTTP/REST and realtime paths, backed by the same authorization and document workflow.

## HTTP and REST methods

| Method | Example | Purpose |
|---|---|---|
| GET | `/api/documents` | List documents visible to the signed-in user |
| POST | `/api/documents` | Create a document |
| GET | `/api/documents/:id` | Read an authorized document |
| PUT | `/api/documents/:id` | Update title/content; content passes through DFA and MongoDB save |
| DELETE | `/api/documents/:id` | Owner deletes document and history |
| PATCH | `/api/documents/:id/lock` | Lock/unlock with ownership checks |

See `docs/api-documentation.md` for the full route catalog.

## Socket.IO events

Client events: `join-document`, `leave-document`, `document-update`, `document-locked`, `document-unlocked`. Server events: `user-joined`, `user-left`, `document-update`, `document-saved`, `document-locked`, `document-unlocked`, `state-updated`. The handshake validates the JWT, room entry checks document membership, and update/lock handlers require room membership and repeat the database authorization check. A disconnect releases locks owned by that user and broadcasts the resulting state.

## OSI and TCP/IP mapping

| OSI layer | TCP/IP layer | This application |
|---|---|---|
| 7 Application | Application | HTTP methods, REST JSON, JWT, Socket.IO events, WebSocket frames |
| 6 Presentation | Application | JSON and UTF-8 text serialization; TLS encryption when deployed behind HTTPS/WSS |
| 5 Session | Application | Authenticated Socket.IO session, room membership, reconnect/disconnect behavior |
| 4 Transport | Transport | TCP for HTTP/WebSocket connections; Socket.IO manages the application connection |
| 3 Network | Internet | IP routing between browser, server and database network endpoint |
| 2 Data Link | Link | Local network framing handled by the host operating systems/network interfaces |
| 1 Physical | Link | Wi-Fi/Ethernet/radio/cabling transports bits physically |

The app's local development configuration uses HTTP; production deployment should terminate TLS and use HTTPS/WSS. Layers 1–3 are provided by the host network and are not reimplemented in JavaScript.

## Network monitor

The Express response middleware records actual method, endpoint, status and duration; Socket.IO handlers record actual connection, room and collaboration events. `/api/monitor/activity` returns the process's bounded in-memory event log, current Socket.IO client count and current document rooms. The log resets on server restart. These values are observed server data, not fabricated performance measurements.
