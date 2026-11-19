import { DocumentDfa, DOCUMENT_STATES, INPUT_ALPHABET } from "../automata/documentDfa.js";

export function transitionDemo(req, res) {
  const { state, input, history = [], rejected = [] } = req.body || {};
  if (!Object.values(DOCUMENT_STATES).includes(state) || !INPUT_ALPHABET.includes(input)) {
    return res.status(400).json({ message: "Provide a known DFA state and input event" });
  }
  const dfa = new DocumentDfa(state);
  try {
    dfa.transition(input, { source: "simulator" });
    res.json({ currentState: dfa.currentState, history: [...history, ...dfa.history].slice(-100), rejected: rejected.slice(-20) });
  } catch (error) {
    res.status(422).json({ message: error.message, rejected: [{ ...dfa.rejected[0], message: error.message }], currentState: state });
  }
}
