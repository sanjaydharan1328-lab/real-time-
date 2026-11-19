import test from "node:test";
import assert from "node:assert/strict";
import { isValidEmail, isValidUsername, isValidDocumentTitle } from "./validators.js";

test("email and username patterns accept expected forms and reject malformed forms", () => {
  assert.equal(isValidEmail("student@example.edu"), true);
  assert.equal(isValidEmail("student at example"), false);
  assert.equal(isValidUsername("student_27"), true);
  assert.equal(isValidUsername("ab"), false);
  assert.equal(isValidUsername("name with space"), false);
});

test("document title validation trims and rejects unsafe or oversized input", () => {
  assert.equal(isValidDocumentTitle("  Group Notes  "), true);
  assert.equal(isValidDocumentTitle("<script>"), false);
  assert.equal(isValidDocumentTitle("bad\ntitle"), false);
  assert.equal(isValidDocumentTitle("x".repeat(101)), false);
});
