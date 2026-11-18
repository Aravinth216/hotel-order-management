const express = require("express");
const db      = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const router  = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT o.*,u.name as created_by_name FROM orders o LEFT JOIN users u ON o.created_by=u.id ORDER BY o.created_at DESC"
    );
    if (!orders.length) return res.json([]);
    const [items] = await db.query("SELECT * FROM order_items WHERE order_id IN (?)", [orders.map(o=>o.id)]);
    res.json(orders.map(o=>({ ...o, items: items.filter(i=>i.order_id===o.id) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", authenticate, requireRole("waiter","admin"), async (req, res) => {
  const { table_no, items } = req.body;
  if (!table_no || !items?.length) return res.status(400).json({ error: "table_no and items required" });
  const total = items.reduce((s,i)=>s+i.price*i.qty, 0);
  const conn  = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query("INSERT INTO orders (table_no,total,created_by) VALUES (?,?,?)", [table_no,total,req.user.id]);
    const orderId = r.insertId;
    for (const item of items)
      await conn.query("INSERT INTO order_items (order_id,menu_id,item_name,price,qty) VALUES (?,?,?,?,?)", [orderId,item.id,item.name,item.price,item.qty]);
    await conn.commit();
    const [newOrder] = await conn.query("SELECT * FROM orders WHERE id=?", [orderId]);
    const [newItems] = await conn.query("SELECT * FROM order_items WHERE order_id=?", [orderId]);
    res.json({ ...newOrder[0], items: newItems });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
});

router.patch("/:id/status", authenticate, async (req, res) => {
  const { status } = req.body;
  const valid = ["Created","Accepted","Preparing","Ready","Served","Bill Pending","Paid","Cancelled"];
  if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
  try {
    await db.query("UPDATE orders SET status=? WHERE id=?", [status, req.params.id]);
    res.json({ id: req.params.id, status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/:id/pay", authenticate, requireRole("admin"), async (req, res) => {
  const { pay_method } = req.body;
  if (!pay_method) return res.status(400).json({ error: "pay_method required" });
  try {
    await db.query("UPDATE orders SET status='Paid',paid=TRUE,pay_method=? WHERE id=?", [pay_method, req.params.id]);
    res.json({ id: req.params.id, status: "Paid", pay_method });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/stats/today", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const [[rev]] = await db.query("SELECT COALESCE(SUM(total),0) as revenue FROM orders WHERE paid=TRUE AND DATE(created_at)=CURDATE()");
    const [[cnt]] = await db.query("SELECT COUNT(*) as total, SUM(paid=TRUE) as completed, SUM(paid=FALSE) as pending FROM orders WHERE DATE(created_at)=CURDATE()");
    res.json({ revenue: rev.revenue, ...cnt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
