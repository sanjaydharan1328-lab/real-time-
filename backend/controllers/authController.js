import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { httpError } from "../middleware/errorHandler.js";
import { isValidEmail, isValidUsername } from "../utils/validators.js";

function tokenFor(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  return jwt.sign({}, process.env.JWT_SECRET, { subject: String(user._id), expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

export async function register(req, res) {
  const { username, email, password } = req.body;
  if (!isValidUsername(username || "")) throw httpError(400, "Username must be 3–24 letters, numbers or underscores");
  if (!isValidEmail(email || "")) throw httpError(400, "Enter a valid email address");
  if (typeof password !== "string" || password.length < 8 || password.length > 128) throw httpError(400, "Password must be 8–128 characters");
  const user = await User.create({ username, email, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: tokenFor(user), user: { id: user.id, username: user.username, email: user.email } });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!isValidEmail(email || "") || typeof password !== "string") throw httpError(400, "Enter a valid email and password");
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw httpError(401, "Email or password is incorrect");
  res.json({ token: tokenFor(user), user: { id: user.id, username: user.username, email: user.email } });
}

export function profile(req, res) {
  res.json({ user: { id: req.user.id, username: req.user.username, email: req.user.email } });
}
