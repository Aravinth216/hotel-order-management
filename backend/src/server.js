require("dotenv").config();
const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");
const cors    = require("cors");

const path       = require("path");

const app        = express();
const httpServer = http.createServer(app);
const io         = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use((req, res, next) => { req.io = io; next(); });

app.use("/api/auth",   require("./routes/auth"));
app.use("/api/menu",   require("./routes/menu"));
app.use("/api/orders", require("./routes/orders"));

// Serve static frontend build if present
const distPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(distPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  const indexPath = path.join(distPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send(`
        <html><body style="font-family:sans-serif;padding:40px;background:#060d18;color:#f0f9ff">
          <h2 style="color:#0ea5e9">🏨 Hotel Backend Running! ✅</h2>
          <p>API is live. Frontend build not yet generated or running separately on port 5173.</p>
        </body></html>
      `);
    }
  });
});

// ── Real-time Socket.io ──
io.on("connection", socket => {
  socket.on("join_room", role => socket.join(role));

  socket.on("new_order", order => {
    io.to("kitchen").emit("order_received", order);
    io.to("admin").emit("order_update", order);
  });

  socket.on("status_changed", ({ order, newStatus }) => {
    io.to("admin").emit("order_update", { ...order, status: newStatus });
    if (newStatus === "Ready")
      io.to("waiter").emit("food_ready", { orderId: order.id, table: order.table_no, msg: `🍽️ Order #${order.id} Table ${order.table_no} is READY — go pick it up!` });
    if (newStatus === "Bill Pending")
      io.to("admin").emit("bill_request", { msg: `🧾 Bill request — Table ${order.table_no} — Order #${order.id}` });
  });

  socket.on("payment_done", ({ orderId, table, method }) => {
    io.to("waiter").emit("table_cleared", { table, msg: `✅ Table ${table} paid via ${method}. Clear the table!` });
    io.to("kitchen").emit("order_closed", orderId);
  });

  // Kitchen broadcasts sold out items to waiter in real-time
  socket.on("sold_out_update", (soldOutIds) => {
    io.to("waiter").emit("sold_out_update", soldOutIds);
  });

  // Kitchen broadcasts sold out items to waiter in real-time
  socket.on("sold_out_update", (soldOutIds) => {
    io.to("waiter").emit("sold_out_update", soldOutIds);
    console.log(`🚫 Sold out update: ${soldOutIds.length} items`);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log("==========================================");
  console.log("  🏨  Hotel Manager Backend");
  console.log("==========================================");
  console.log(`  URL  : http://localhost:${PORT}`);
  console.log(`  SETUP: http://localhost:${PORT}/api/auth/setup`);
  console.log("==========================================");
});
