const express = require("express");
const db      = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const router  = express.Router();

router.get("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM customers ORDER BY total_spent DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/search", authenticate, requireRole("admin"), async (req, res) => {
  const { mobile } = req.query;
  if (!mobile) return res.status(400).json({ error: "mobile required" });
  try {
    const [[customer]] = await db.query("SELECT * FROM customers WHERE mobile=?", [mobile]);
    res.json(customer || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id/history", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const [[customer]] = await db.query("SELECT * FROM customers WHERE id=?", [req.params.id]);
    if (!customer) return res.status(404).json({ error: "Not found" });
    const [orders] = await db.query(
      "SELECT o.*,oi.item_name,oi.qty,oi.price FROM orders o LEFT JOIN order_items oi ON o.id=oi.order_id WHERE o.customer_id=? ORDER BY o.created_at DESC",
      [req.params.id]
    );
    res.json({ customer, orders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
