# Department-Level Comprehensive Assessment report

## Project title

**Real-Time Collaborative Document Editing System Using MERN Stack and Finite Automata**

## Official problem statement

Students working on group assignments need to edit shared documents simultaneously. Develop a collaborative web application using real-time network communication and finite automata to model document editing, saving and locking states.

## Introduction and abstract

Group assignment work often involves exchanging document copies and merging edits manually. This project provides a shared browser workspace where authorized students can edit the same text, see live updates and presence, and use a lock to prevent conflicting changes. The React client communicates with an Express API through HTTP/REST and with authenticated Socket.IO rooms for real-time events. MongoDB stores user, document and document-history records. A backend JavaScript DFA validates editing, saving and locking state changes. The database write must succeed before a save is acknowledged as complete.

## Objectives

- Build a full-stack application with user accounts and private/shared documents.
- Persist document content and state in MongoDB.
- Deliver real-time room updates and collaborator presence using Socket.IO.
- Enforce lock ownership and valid state changes on the server.
- Demonstrate regular expressions, a DFA and client-server networking through source code and the UI.
- Provide assessment documentation and record real test results without inventing outcomes.

## Existing and proposed systems

The common existing workflow uses separate files, email or chat attachments, and manual consolidation. It offers weak visibility into who is editing and can lose changes during merge. The proposed system stores one shared document, authenticates users, authorizes membership, broadcasts updates to a document room and persists accepted edits. A state machine and lock checks provide a simple, explainable conflict-prevention mechanism.

## Functional requirements

Registration/login/logout/profile; create/list/search/share/update/delete documents; show modification and state; authenticated collaborative editing; live presence and updates; automatic saving with database-confirmed success; lock/unlock with owner checks and disconnect cleanup; document history; backend DFA demonstration; actual HTTP/Socket activity view.

## Non-functional requirements

Usability, responsive layout, understandable modular code, server-side authorization, hashed credentials, bounded input size, clear errors, database durability, and accurate save-state reporting. Production deployment should use TLS, secret management, database backups and operational monitoring.

## Hardware and software requirements

Development: a modern dual-core computer, 4 GB RAM minimum (8 GB recommended), network connection, current browser, Node.js 20+, npm, MongoDB 7 local or Atlas, and a code editor. Runtime resources depend on concurrent users and document size; text payload is capped at 1 MB in this implementation.

## Architecture and diagrams

See [`architecture.md`](architecture.md), [`diagrams/use-case.md`](diagrams/use-case.md), and [`diagrams/data-flow.md`](diagrams/data-flow.md). The architecture separates React, Express controllers/routes, workflow services, Mongoose models, the backend DFA and Socket.IO handlers.

## Database design

See [`database-design.md`](database-design.md) for fields, references and the ER diagram. Collections are Users, Documents and DocumentHistory.

## Frontend implementation

React Router pages include login, registration, dashboard, editor, history, profile, DFA simulator and network monitor. Hooks manage authentication, document content, collaborator presence, server state and observed network records. Axios sends REST calls; `socket.io-client` joins rooms and carries live events. Core page files are under `frontend/src/pages/`.

## Backend implementation

Express MVC routes/controllers use Mongoose models and services. JWT middleware protects API routes. Passwords are bcrypt hashes. Document access checks require owner/collaborator membership; only the owner can share/delete/rename, and only a lock owner can unlock. The DFA resides in `backend/automata/documentDfa.js`; socket events are in `backend/sockets/index.js`.

## REST API

See [`api-documentation.md`](api-documentation.md). The API supports GET/POST/PUT/DELETE for document operations plus auth, sharing, lock, history, monitor and DFA demonstration routes.

## Computer Networks integration

See [`computer-networks.md`](computer-networks.md) for HTTP, REST, TCP/IP, OSI mapping and Socket.IO events. The browser-server architecture uses HTTP for CRUD and Socket.IO for real-time communication.

## Formal Languages and Automata Theory

See [`formal-automata.md`](formal-automata.md) for the DFA tuple, transition table/diagram, valid and rejected events, and regular expressions. The same automaton module is used by real backend workflows and the simulator.

## Testing

See [test-cases.md](test-cases.md) for actual expected and actual results. The backend DFA/validator suite passed 7/7; backend audit reported zero vulnerabilities. The frontend production build passed. A MongoDB-backed REST and Socket.IO integration smoke test passed 9 groups using two authenticated socket clients, including authorization, sharing, live updates, persistence, locking, disconnect cleanup, history and network activity. API health and frontend availability checks returned success. The integration smoke test used concurrent socket clients; separate-browser visual verification remains a manual demonstration step.

## Output screenshots

No application screenshots are included yet. They must be captured from the running app after installing Node.js dependencies and configuring MongoDB; screenshots should show registration/login, dashboard, two-browser collaboration, lock state, DFA simulator and network activity. No static mockups are presented as application output.

## Conclusion

The implemented application integrates MERN full-stack development, HTTP and Socket.IO networking, and a backend-enforced DFA for document editing, saving and locking. Unit, build and database-backed socket/API smoke checks are recorded in the test-case document. The project is runnable locally when MongoDB and the documented environment variables are available.

## Future enhancements

Rich-text editing, cursor/selection presence, operational transformation or CRDT conflict resolution, version restore, document-level roles, pagination, audit retention, automated browser tests, TLS deployment and production-grade telemetry.
