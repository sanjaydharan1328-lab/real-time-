live link:https://real-time-alpha-six.vercel.app/
 
 
 # Real-Time Collaborative Document Editing System

**Project title:** Real-Time Collaborative Document Editing System Using MERN Stack and Finite Automata

This project implements the assigned collaborative editing problem for an individual Department-Level Comprehensive Assessment (2026–2027). It uses React, Express, MongoDB/Mongoose and Socket.IO, with a backend-enforced DFA for document editing, saving and locking.

## Included

- JWT registration/login, protected profile and bcrypt password hashing
- Private documents, sharing with registered users, list/search, update and owner deletion
- Authenticated Socket.IO rooms, collaborator presence, live updates and lock/unlock behavior
- Automatic MongoDB persistence; the UI reports Saved only after content and saved state are persisted
- Backend DFA module and simulator, regex validators, document history, and observed network activity page
- Academic documentation, diagrams, API notes and test cases under `docs/`

## Prerequisites

- Node.js 20.19 or newer and npm
- MongoDB 7+ locally or a MongoDB Atlas URI

## Run locally (Windows PowerShell)

1. Install MongoDB and start the MongoDB service, or set `MONGODB_URI` to your Atlas connection string.
2. Copy `backend/.env.example` to `backend/.env`. Set `MONGODB_URI` and replace `JWT_SECRET` with a random secret of at least 32 characters.
3. From the repository root, install dependencies: `npm.cmd install`, `npm.cmd --prefix backend install`, and `npm.cmd --prefix frontend install`.
4. Run `npm.cmd run dev` to start Express/Socket.IO and Vite together.
5. Open `http://localhost:5173`. The API and Socket.IO server use port 5000 by default.

If using the extracted Node.js ZIP instead of an installer, add its folder to this PowerShell window's PATH first, for example:

```powershell
$nodeDir = "$env:USERPROFILE\Downloads\node-v26.13.1-win-x64 (3)\node-v26.13.1-win-x64"
$env:Path = "$nodeDir;$env:Path"
```

Use `npm.cmd` in PowerShell if its script execution policy blocks `npm.ps1`.

Run backend unit tests with `npm.cmd --prefix backend test` and build the frontend with `npm.cmd run build`. For a classroom collaboration demonstration, register two accounts, share a document with the second account, then open that document in separate browser sessions.

## Configuration

`backend/.env.example` lists server variables. Optional frontend overrides are `VITE_API_URL` (defaults to `http://localhost:5000/api`) and `VITE_SOCKET_URL` (defaults to `http://localhost:5000`). Never put MongoDB credentials or the JWT secret in frontend variables.

## Workspace map

```text
backend/       Express MVC, Mongoose models, auth, DFA, services and sockets
frontend/      React app, routes, pages, API client and responsive styling
docs/          Assessment report, architecture, database, networking, DFA and tests
screenshots/   Instructions for capturing genuine output from the running app
```

## Verification status

Backend DFA/validator tests passed **7/7**; backend dependency audit reported **zero vulnerabilities** when run. The Vite production build passed. A MongoDB-backed REST/Socket.IO smoke test passed its 9 verification groups with two independent socket clients, and local API/frontend availability returned success. The recorded integration run did not include visual verification in two separate browser windows. Detailed actual results are in [`docs/test-cases.md`](docs/test-cases.md).
