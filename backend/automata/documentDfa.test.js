import test from "node:test";
import assert from "node:assert/strict";
import { DocumentDfa, DOCUMENT_STATES, INPUT_ALPHABET, InvalidTransitionError } from "./documentDfa.js";

test("complete save lifecycle follows Editing → Saving → Saved", () => {
  const dfa = new DocumentDfa(DOCUMENT_STATES.IDLE);
  assert.equal(dfa.transition("START_EDIT").to, "Editing");
  assert.equal(dfa.transition("SAVE").to, "Saving");
  assert.equal(dfa.transition("SAVE_SUCCESS").to, "Saved");
  assert.deepEqual(dfa.history.map((item) => item.input), ["START_EDIT", "SAVE", "SAVE_SUCCESS"]);
});

test("save failure returns the automaton to Editing", () => {
  const dfa = new DocumentDfa("Editing");
  dfa.transition("SAVE");
  assert.equal(dfa.transition("SAVE_FAILURE").to, "Editing");
});

test("lock can only be released by the declared UNLOCK transition", () => {
  const dfa = new DocumentDfa("Saved");
  assert.equal(dfa.transition("LOCK").to, "Locked");
  assert.equal(dfa.transition("UNLOCK").to, "Saved");
});

test("invalid transitions are rejected and retained in the rejection history", () => {
  const dfa = new DocumentDfa("Idle");
  assert.throws(() => dfa.transition("SAVE"), InvalidTransitionError);
  assert.equal(dfa.currentState, "Idle");
  assert.equal(dfa.rejected[0].input, "SAVE");
  assert.equal(dfa.rejected[0].accepted, false);
});

test("alphabet and current-state accepted inputs are exposed", () => {
  const dfa = new DocumentDfa("Editing");
  assert.deepEqual(dfa.acceptedInputs.sort(), ["LOCK", "SAVE", "STOP_EDIT"].sort());
  assert.equal(INPUT_ALPHABET.includes("SAVE_SUCCESS"), true);
});
