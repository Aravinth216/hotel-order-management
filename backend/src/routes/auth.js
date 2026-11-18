const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const db      = require("../db");
const router  = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (!rows.length) return res.status(401).json({ error: "Wrong username or password" });
    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Wrong username or password" });
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET || "hotel_secret",
      { expiresIn: "12h" }
    );
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/setup  — run once in browser to hash passwords
router.get("/setup", async (req, res) => {
  try {
    const [existing] = await db.query("SELECT password FROM users WHERE password LIKE '$2%' LIMIT 1");
    if (existing.length && req.query.force !== "true") {
      return res.status(403).send(`
        <html><body style="font-family:sans-serif;padding:40px;background:#060d18;color:#f0f9ff">
          <h2 style="color:#f59e0b">⚠️ Setup Already Completed</h2>
          <p>Passwords are already initialized. For security, setup cannot be re-run on a live database.</p>
          <p><a href="/" style="color:#0ea5e9">← Go to App</a></p>
        </body></html>
      `);
    }
    const users = [
      { username: "admin",   password: "admin123"   },
      { username: "kitchen", password: "kitchen123" },
      { username: "waiter",  password: "waiter123"  },
    ];
    for (const u of users) {
      const hashed = await bcrypt.hash(u.password, 10);
      await db.query("UPDATE users SET password = ? WHERE username = ?", [hashed, u.username]);
    }
    res.send(`
      <html><body style="font-family:sans-serif;padding:40px;background:#060d18;color:#f0f9ff">
        <h2 style="color:#0ea5e9">✅ Hotel App Setup Complete!</h2>
        <p>Passwords have been set. You can now login:</p>
        <ul style="line-height:2">
          <li>Admin &nbsp;&nbsp;→ username: <b>admin</b> &nbsp;&nbsp;password: <b>admin123</b></li>
          <li>Kitchen → username: <b>kitchen</b> password: <b>kitchen123</b></li>
          <li>Waiter &nbsp;→ username: <b>waiter</b> &nbsp;password: <b>waiter123</b></li>
        </ul>
        <p>Now open <a href="http://localhost:5173" style="color:#0ea5e9">http://localhost:5173</a> to use the app!</p>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send(`<html><body style="padding:40px;font-family:sans-serif;background:#060d18;color:#f43f5e">
      <h2>❌ Setup Failed</h2><p>${err.message}</p>
      <p>Make sure MySQL is running and database is set up first.</p>
    </body></html>`);
  }
});

module.exports = router;
