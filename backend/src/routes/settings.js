const express = require("express");
const db      = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const router  = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const [[s]] = await db.query("SELECT * FROM settings WHERE id=1");
    res.json(s || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/", authenticate, requireRole("admin"), async (req, res) => {
  const { restaurant_name, gst_number, gst_percent, service_charge_enabled, service_charge_percent, round_off_enabled, receipt_footer, admin_email } = req.body;
  try {
    await db.query(
      "UPDATE settings SET restaurant_name=?,gst_number=?,gst_percent=?,service_charge_enabled=?,service_charge_percent=?,round_off_enabled=?,receipt_footer=?,admin_email=? WHERE id=1",
      [restaurant_name, gst_number, gst_percent, service_charge_enabled, service_charge_percent, round_off_enabled, receipt_footer, admin_email]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
