/**
 * Deterministic finite automaton used by backend document workflows.
 * It is intentionally independent of HTTP and MongoDB so transitions are
 * easy to inspect and reuse from controllers and Socket.IO handlers.
 */
export const DOCUMENT_STATES = Object.freeze({
  IDLE: "Idle",
  EDITING: "Editing",
  SAVING: "Saving",
  SAVED: "Saved",
  LOCKED: "Locked",
});

export const INPUT_ALPHABET = Object.freeze([
  "START_EDIT",
  "SAVE",
  "SAVE_SUCCESS",
  "SAVE_FAILURE",
  "LOCK",
  "UNLOCK",
  "STOP_EDIT",
]);

const transitions = Object.freeze({
  [DOCUMENT_STATES.IDLE]: Object.freeze({ START_EDIT: DOCUMENT_STATES.EDITING }),
  [DOCUMENT_STATES.EDITING]: Object.freeze({
    SAVE: DOCUMENT_STATES.SAVING,
    LOCK: DOCUMENT_STATES.LOCKED,
    STOP_EDIT: DOCUMENT_STATES.IDLE,
  }),
  [DOCUMENT_STATES.SAVING]: Object.freeze({
    SAVE_SUCCESS: DOCUMENT_STATES.SAVED,
    SAVE_FAILURE: DOCUMENT_STATES.EDITING,
  }),
  [DOCUMENT_STATES.SAVED]: Object.freeze({
    START_EDIT: DOCUMENT_STATES.EDITING,
    LOCK: DOCUMENT_STATES.LOCKED,
    STOP_EDIT: DOCUMENT_STATES.IDLE,
  }),
  [DOCUMENT_STATES.LOCKED]: Object.freeze({ UNLOCK: DOCUMENT_STATES.SAVED }),
});

export class InvalidTransitionError extends Error {
  constructor(state, input) {
    super(`Input ${input} is not accepted from state ${state}`);
    this.name = "InvalidTransitionError";
    this.state = state;
    this.input = input;
  }
}

export class DocumentDfa {
  constructor(initialState = DOCUMENT_STATES.IDLE) {
    if (!Object.values(DOCUMENT_STATES).includes(initialState)) {
      throw new TypeError(`Unknown document state: ${initialState}`);
    }
    this.currentState = initialState;
    this.history = [];
    this.rejected = [];
  }

  get acceptedInputs() {
    return Object.keys(transitions[this.currentState]);
  }

  transition(input, metadata = {}) {
    const nextState = transitions[this.currentState]?.[input];
    if (!nextState) {
      const record = {
        input,
        from: this.currentState,
        accepted: false,
        timestamp: new Date().toISOString(),
        ...metadata,
      };
      this.rejected.push(record);
      throw new InvalidTransitionError(this.currentState, input);
    }

    const record = {
      input,
      from: this.currentState,
      to: nextState,
      accepted: true,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
    this.currentState = nextState;
    this.history.push(record);
    return record;
  }

  snapshot() {
    return {
      currentState: this.currentState,
      alphabet: [...INPUT_ALPHABET],
      acceptedInputs: this.acceptedInputs,
      history: [...this.history],
      rejected: [...this.rejected],
    };
  }
}

export function nextDocumentState(state, input) {
  const next = transitions[state]?.[input];
  if (!next) throw new InvalidTransitionError(state, input);
  return next;
}
