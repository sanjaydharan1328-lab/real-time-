export const PATTERNS = Object.freeze({
  email: /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/,
  username: /^[A-Za-z0-9_]{3,24}$/,
  documentTitle: /^[^\u0000-\u001F<>]{1,100}$/,
});

export const isValidEmail = (value) => PATTERNS.email.test(value);
export const isValidUsername = (value) => PATTERNS.username.test(value);
export const isValidDocumentTitle = (value) =>
  typeof value === "string" && PATTERNS.documentTitle.test(value.trim());
