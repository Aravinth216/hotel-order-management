const express = require("express");
const db      = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const router  = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM menu WHERE available=TRUE ORDER BY category,name");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", authenticate, requireRole("admin"), async (req, res) => {
  const { name, price, category } = req.body;
  if (!name || !price || !category) return res.status(400).json({ error: "All fields required" });
  try {
    const [r] = await db.query("INSERT INTO menu (name,price,category) VALUES (?,?,?)", [name,price,category]);
    res.json({ id: r.insertId, name, price, category, available: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    await db.query("UPDATE menu SET available=FALSE WHERE id=?", [req.params.id]);
    res.json({ message: "Removed" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
