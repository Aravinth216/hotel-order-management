const express = require("express");
const db      = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const router  = express.Router();

router.post("/start", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const [r] = await db.query("INSERT INTO shifts (started_by,start_time) VALUES (?,NOW())", [req.user.id]);
    res.json({ id: r.insertId, status: "open" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/close", authenticate, requireRole("admin"), async (req, res) => {
  const { shift_id } = req.body;
  try {
    const [[shift]] = await db.query("SELECT * FROM shifts WHERE id=? AND status='open'", [shift_id]);
    if (!shift) return res.status(404).json({ error: "No open shift found" });
    const [orders] = await db.query("SELECT * FROM orders WHERE paid=TRUE AND created_at >= ?", [shift.start_time]);
    const totalRevenue = orders.reduce((s,o) => s + Number(o.final_amount||o.total), 0);
    const cash = orders.filter(o=>o.pay_method==="Cash").reduce((s,o)=>s+Number(o.final_amount||o.total),0);
    const upi  = orders.filter(o=>["GPay","PhonePe","UPI"].includes(o.pay_method)).reduce((s,o)=>s+Number(o.final_amount||o.total),0);
    const card = orders.filter(o=>o.pay_method==="Card").reduce((s,o)=>s+Number(o.final_amount||o.total),0);
    const [[cancelled]] = await db.query("SELECT COUNT(*) as cnt FROM orders WHERE status='Cancelled' AND created_at >= ?", [shift.start_time]);
    await db.query(
      "UPDATE shifts SET status='closed',end_time=NOW(),closed_by=?,total_orders=?,total_revenue=?,cash_collection=?,upi_collection=?,card_collection=?,cancelled_orders=? WHERE id=?",
      [req.user.id, orders.length, totalRevenue, cash, upi, card, cancelled.cnt, shift_id]
    );
    res.json({ success: true, totalRevenue, totalOrders: orders.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM shifts ORDER BY start_time DESC LIMIT 30");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
