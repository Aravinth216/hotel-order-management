const express = require("express");
const db      = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const router  = express.Router();

function makeKOT(id) {
  const d = new Date();
  const dt = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  return `KOT-${dt}-${String(id).padStart(4,"0")}`;
}

// GET all orders
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

// POST create order
router.post("/", authenticate, requireRole("waiter","admin"), async (req, res) => {
  const { table_no, items, special_instruction, order_source } = req.body;
  if (!table_no || !items?.length) return res.status(400).json({ error: "table_no and items required" });
  const total = items.reduce((s,i) => s + i.price * i.qty, 0);
  const conn  = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      "INSERT INTO orders (table_no,total,subtotal,created_by,special_instruction,order_source) VALUES (?,?,?,?,?,?)",
      [table_no, total, total, req.user.id, special_instruction||"", order_source||"staff"]
    );
    const orderId = r.insertId;
    const kotNumber = makeKOT(orderId);
    await conn.query("UPDATE orders SET kot_number=? WHERE id=?", [kotNumber, orderId]);
    for (const item of items)
      await conn.query(
        "INSERT INTO order_items (order_id,menu_id,item_name,price,qty,special_instruction) VALUES (?,?,?,?,?,?)",
        [orderId, item.id||0, item.name||item.item_name, item.price, item.qty, item.special_instruction||""]
      );
    await conn.commit();
    const [newOrder] = await conn.query("SELECT o.*,u.name as created_by_name FROM orders o LEFT JOIN users u ON o.created_by=u.id WHERE o.id=?", [orderId]);
    const [newItems] = await conn.query("SELECT * FROM order_items WHERE order_id=?", [orderId]);
    res.json({ ...newOrder[0], items: newItems });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
});

// PATCH update status
router.patch("/:id/status", authenticate, async (req, res) => {
  const { status, cancel_reason } = req.body;
  const valid = ["Created","Accepted","Preparing","Ready","Served","Bill Pending","Paid","Cancelled"];
  if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
  try {
    await db.query("UPDATE orders SET status=?, cancel_reason=? WHERE id=?", [status, cancel_reason||null, req.params.id]);
    res.json({ id: req.params.id, status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH collect payment
router.patch("/:id/pay", authenticate, requireRole("admin"), async (req, res) => {
  const { pay_method, gst_percent, service_charge_percent, discount_type, discount_value, customer_name, customer_mobile } = req.body;
  if (!pay_method) return res.status(400).json({ error: "pay_method required" });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query("SELECT * FROM orders WHERE id=?", [req.params.id]);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const sub  = Number(order.total);
    const gstP = Number(gst_percent||0);
    const scP  = Number(service_charge_percent||0);
    const gstAmt = sub * (gstP/100);
    const scAmt  = sub * (scP/100);
    const dType  = discount_type || "fixed";
    const dVal   = Number(discount_value||0);
    const dAmt   = dType === "percent" ? sub*(dVal/100) : dVal;
    const before = sub + gstAmt + scAmt - dAmt;
    const rOff   = Math.round(before) - before;
    const final  = Math.max(0, before + rOff);

    let customerId = null;
    if (customer_mobile && customer_name) {
      const [[existing]] = await conn.query("SELECT id FROM customers WHERE mobile=?", [customer_mobile]);
      if (existing) {
        await conn.query("UPDATE customers SET name=?,total_visits=total_visits+1,total_spent=total_spent+?,last_visit=NOW() WHERE id=?", [customer_name, final, existing.id]);
        customerId = existing.id;
      } else {
        const [cr] = await conn.query("INSERT INTO customers (name,mobile,total_spent) VALUES (?,?,?)", [customer_name, customer_mobile, final]);
        customerId = cr.insertId;
      }
    }

    await conn.query(
      "UPDATE orders SET status='Paid',paid=TRUE,pay_method=?,gst_percent=?,gst_amount=?,service_charge_amount=?,discount_type=?,discount_value=?,discount_amount=?,round_off=?,final_amount=?,customer_id=?,customer_name=?,customer_mobile=? WHERE id=?",
      [pay_method, gstP, gstAmt, scAmt, dType, dVal, dAmt, rOff, final, customerId, customer_name||null, customer_mobile||null, req.params.id]
    );
    await conn.commit();
    res.json({ id: req.params.id, status: "Paid", pay_method, final_amount: final });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
});

module.exports = router;
