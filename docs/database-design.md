# Database design

MongoDB stores three Mongoose collections. Relationships use ObjectIds and references.

| Collection | Fields and relationships |
|---|---|
| Users | `username`, unique lowercase `email`, `passwordHash` (excluded from normal queries), `createdAt` |
| Documents | `title`, `content`, `owner → Users`, `collaborators → Users[]`, `currentState`, `isLocked`, `lockedBy → Users`, `createdAt`, `updatedAt` |
| DocumentHistory | `documentId → Documents`, `userId → Users`, `action`, `previousState`, `newState`, `timestamp` |

```mermaid
erDiagram
  USERS ||--o{ DOCUMENTS : owns
  USERS }o--o{ DOCUMENTS : collaborates
  USERS ||--o{ DOCUMENT_HISTORY : performs
  DOCUMENTS ||--o{ DOCUMENT_HISTORY : records
  USERS {
    ObjectId _id PK
    string username
    string email UK
    string passwordHash
    date createdAt
  }
  DOCUMENTS {
    ObjectId _id PK
    string title
    string content
    ObjectId owner FK
    ObjectId[] collaborators FK
    string currentState
    boolean isLocked
    ObjectId lockedBy FK
    date createdAt
    date updatedAt
  }
  DOCUMENT_HISTORY {
    ObjectId _id PK
    ObjectId documentId FK
    ObjectId userId FK
    string action
    string previousState
    string newState
    date timestamp
  }
```

Schemas are in `backend/models/`. Mongoose validates required fields, enum state, uniqueness, length bounds and email/username forms. Passwords are bcrypt hashes; the API never returns the hash. Deleting a document also removes its history.
