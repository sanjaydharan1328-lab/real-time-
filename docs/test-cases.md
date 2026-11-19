# Test cases and execution record

Verification was executed in the project workspace on 18 November 2026 using Node.js 26.13.1 and npm 11.20.0. “Passed” below means the check was actually run; browser-level multi-window visual testing has not been recorded.

| ID | Test | Expected result | Actual result |
|---|---|---|---|
| T01 | Register two valid users | 201 responses and authenticated accounts | Passed in REST/Socket.IO smoke test |
| T02 | Login | Valid account receives authenticated session | Authentication exercised for two users in smoke test |
| T03 | Create and retrieve document | Document persists and owner can retrieve it | Passed |
| T04 | Update/delete document | Changes persist; owner can delete | Passed; deletion cleanup verified |
| T05 | Two collaborators join shared document | Authorized joins and presence events | Passed using two independent Socket.IO clients |
| T06 | Live edit broadcast | Other client receives change without refresh | Passed; broadcast content matched |
| T07 | Automatic save | Saving precedes Saved; MongoDB persistence confirmed | Passed; saved content retrieved from MongoDB |
| T08 | Lock and reject collaborator edit | Other user cannot modify a locked document | Passed |
| T09 | Unlock authorization | Non-owner cannot unlock; lock owner may unlock | Passed; owner-disconnect release also verified |
| T10 | Invalid DFA event from Idle | Rejected, state unchanged, rejection recorded | Passed in unit test |
| T11 | Valid DFA lifecycle | Events reach expected states | Passed in unit tests and integration smoke test |
| T12 | Private-document authorization | Non-member cannot read private document | Passed; API returned not found |
| T13 | Disconnect while holding lock | Server releases lock and records valid transition | Passed |
| T14 | Refresh/reload after save | Database returns persisted content | Passed via subsequent REST retrieval |
| T15 | Network monitor | Displays observed HTTP/socket activity | Passed; actual requests/events observed |
| T16 | Regex validation | Valid email, username and title accepted; invalid rejected | Passed in unit tests |
| T17 | Frontend production build | Vite emits production bundle | Passed; Vite 7.3.8 built 1,687 modules in 3.32 seconds |
| T18 | API availability | Health endpoint returns success | Passed; `GET /api/health` returned `{"status":"ok"}` |

## Executed checks

- `npm --prefix backend test`: **7 passed, 0 failed** (DFA and validator tests).
- Backend `npm audit`: **0 vulnerabilities** at execution time.
- `npm.cmd run build`: **passed**, production assets emitted under `frontend/dist/`.
- REST and Socket.IO integration smoke test: **9 groups passed**, using MongoDB on localhost and two independently authenticated Socket.IO clients. It checked registration, private access denial, sharing, room presence, live update/save persistence, lock enforcement, disconnect release, history/network records and owner deletion. Temporary test records were cleaned up.
- Runtime availability: API health response and frontend HTTP response **200**.

The smoke test verifies real backend networking with two concurrent socket clients; it does not claim a visual test with two separate browser windows. See README for local run instructions.
