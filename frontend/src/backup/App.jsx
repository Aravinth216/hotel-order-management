import { useState, useEffect, useRef, useCallback } from "react";

const HOST = window.location.hostname;
const API  = `http://${HOST}:4000/api`;
const WS   = `http://${HOST}:4000`;

const T = {
  bg:"#060d18", bgCard:"#0b1628", bgCard2:"#0f1e35", bgCard3:"#132240",
  border:"#1a3050", borderHi:"#0ea5e955",
  teal:"#0ea5e9", tealGlow:"#0ea5e918", tealLight:"#38bdf8",
  white:"#f0f9ff", muted:"#4e6a8a", mutedLt:"#7a9ab8",
  green:"#10b981", red:"#f43f5e", amber:"#f59e0b",
  purple:"#8b5cf6", cyan:"#06b6d4",
};
const SC  = { Created:"#f59e0b",Accepted:"#0ea5e9",Preparing:"#8b5cf6",Ready:"#10b981",Served:"#06b6d4","Bill Pending":"#f43f5e",Paid:"#10b981" };
const PC  = { Cash:T.green,GPay:T.teal,PhonePe:T.purple,Card:T.amber,UPI:T.cyan };
const PI  = { Cash:"💵",GPay:"📱",PhonePe:"📲",Card:"💳",UPI:"🔗" };
const TABLES=["A1","A2","A3","B1","B2","B3","C1","C2"];
const PAY_METHODS=["Cash","GPay","PhonePe","Card","UPI"];
const CATEGORIES=["Veg","Non-Veg","Drinks","Desserts"];

const S = {
  app:     { fontFamily:"'Inter',system-ui,sans-serif",background:T.bg,minHeight:"100vh",color:T.white },
  header:  { background:`linear-gradient(135deg,${T.bgCard},${T.bg})`,borderBottom:`1px solid ${T.border}`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 },
  logo:    { fontSize:18,fontWeight:900,color:T.teal,display:"flex",alignItems:"center",gap:8 },
  roleBadge:{ background:T.tealGlow,border:`1px solid ${T.borderHi}`,borderRadius:20,padding:"4px 14px",fontSize:12,color:T.tealLight },
  logoutBtn:{ background:"transparent",color:T.red,border:`1px solid ${T.red}55`,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:700 },
  nav:     { display:"flex",borderBottom:`1px solid ${T.border}`,background:T.bgCard },
  navBtn:  (a,c=T.teal)=>({ flex:1,background:a?`${c}18`:"transparent",color:a?c:T.muted,border:"none",borderBottom:`2px solid ${a?c:"transparent"}`,padding:"10px 4px",cursor:"pointer",fontWeight:a?700:400,fontSize:12,transition:"all 0.2s" }),
  body:    { padding:16 },
  card:    { background:T.bgCard2,border:`1px solid ${T.border}`,borderRadius:12,padding:14,marginBottom:10 },
  cardHi:  { background:T.bgCard2,border:`1px solid ${T.borderHi}`,borderRadius:12,padding:14,marginBottom:10,boxShadow:`0 0 20px ${T.teal}0a` },
  input:   { background:T.bgCard3,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.white,fontSize:14,width:"100%",boxSizing:"border-box",outline:"none" },
  select:  { background:T.bgCard3,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.white,fontSize:14,width:"100%",boxSizing:"border-box",outline:"none" },
  btn:     (c=T.teal)=>({ background:c,color:"#fff",border:"none",borderRadius:10,padding:"11px 18px",cursor:"pointer",fontWeight:700,fontSize:14,width:"100%",marginTop:8 }),
  btnSm:   (c=T.teal,out=false)=>({ background:out?"transparent":c,color:out?c:"#fff",border:`1px solid ${c}${out?"88":""}`,borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600 }),
  badge:   (c)=>({ display:"inline-block",background:c+"22",color:c,border:`1px solid ${c}44`,borderRadius:10,padding:"2px 10px",fontSize:11,fontWeight:700 }),
  divider: { borderTop:`1px solid ${T.border}`,margin:"10px 0" },
  label:   { fontSize:10,color:T.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1.5 },
  secTitle:{ fontSize:14,fontWeight:700,color:T.white,marginBottom:12 },
  menuRow: { display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${T.border}` },
  notif:   { background:`${T.green}15`,border:`1px solid ${T.green}44`,borderRadius:10,padding:"10px 14px",marginBottom:8,fontSize:13,color:"#6ee7b7",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8 },
  loader:  { color:T.muted,textAlign:"center",padding:24,fontSize:14 },
  err:     { color:T.red,fontSize:13,marginBottom:8 },
  grid2:   { display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 },
  grid3:   { display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 },
};

const apiFetch = async (path,method="GET",body=null,token=null) => {
  const headers={"Content-Type":"application/json"};
  if(token) headers["Authorization"]=`Bearer ${token}`;
  const res=await fetch(`${API}${path}`,{method,headers,body:body?JSON.stringify(body):null});
  const data=await res.json();
  if(!res.ok) throw new Error(data.error||"Request failed");
  return data;
};

function useSocket(role,handlers) {
  const ref=useRef(null);
  useEffect(()=>{
    if(!role) return;
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.6.2/socket.io.min.js";
    s.onload=()=>{
      const sock=window.io(WS,{transports:["websocket","polling"]});
      ref.current=sock;
      sock.on("connect",()=>sock.emit("join_room",role));
      Object.entries(handlers).forEach(([ev,fn])=>sock.on(ev,fn));
    };
    document.head.appendChild(s);
    return ()=>{ if(ref.current) ref.current.disconnect(); try{document.head.removeChild(s);}catch{} };
  },[role]);
  return ref;
}

// ─── SVG BANNERS ─────────────────────────────────────────────────────────────
function WaiterBanner() {
  return (
    <div style={{background:"linear-gradient(135deg,#051a28,#072436)",borderBottom:`1px solid ${T.teal}33`,padding:"16px 16px 12px",position:"relative",overflow:"hidden",flexShrink:0}}>
      <svg style={{position:"absolute",right:0,top:0,opacity:0.18}} width={130} height={88} viewBox="0 0 130 88">
        <ellipse cx={100} cy={72} rx={28} ry={8} fill={T.teal}/>
        <rect x={72} y={42} width={56} height={32} rx={5} fill={T.teal}/>
        <ellipse cx={85} cy={42} rx={10} ry={3.5} fill="#fff" opacity="0.5"/>
        <ellipse cx={107} cy={42} rx={10} ry={3.5} fill="#fff" opacity="0.5"/>
        <circle cx={24} cy={22} r={12} fill={T.teal}/>
        <rect x={15} y={34} width={18} height={24} rx={4} fill={T.teal}/>
        <rect x={30} y={28} width={32} height={4} rx={2} fill={T.teal} opacity="0.8"/>
        <ellipse cx={62} cy={28} rx={13} ry={4.5} fill="#fff" opacity="0.5"/>
        <rect x={55} y={21} width={5} height={7} rx={1} fill={T.amber} opacity="0.8"/>
        <rect x={63} y={19} width={5} height={9} rx={1} fill={T.green} opacity="0.8"/>
        <circle cx={72} cy={24} r={3.5} fill={T.red} opacity="0.7"/>
        <path d="M20 35 L24 38 L28 35 L24 32Z" fill="#fff" opacity="0.5"/>
      </svg>
      <div style={{fontSize:10,color:T.teal,fontWeight:800,textTransform:"uppercase",letterSpacing:2}}>WAITER</div>
      <div style={{fontSize:24,fontWeight:900,color:T.white,marginTop:2,lineHeight:1}}>Table Orders</div>
      <div style={{fontSize:12,color:T.mutedLt,marginTop:5}}>Take orders from tables & serve 🪑</div>
    </div>
  );
}

function KitchenBanner({ queueCount }) {
  return (
    <div style={{background:"linear-gradient(135deg,#120820,#1c0d30)",borderBottom:`1px solid ${T.purple}33`,padding:"16px 16px 12px",position:"relative",overflow:"hidden"}}>
      <svg style={{position:"absolute",right:0,top:0,opacity:0.2}} width={130} height={88} viewBox="0 0 130 88">
        <rect x={60} y={46} width={65} height={36} rx={6} fill={T.purple}/>
        <ellipse cx={92} cy={46} rx={32} ry={7} fill="#a78bfa"/>
        <circle cx={78} cy={46} r={8} fill={T.purple} stroke="#c4b5fd" strokeWidth="1.5"/>
        <circle cx={107} cy={46} r={8} fill={T.purple} stroke="#c4b5fd" strokeWidth="1.5"/>
        <ellipse cx={78} cy={32} rx={15} ry={5.5} fill="#7c3aed"/>
        <rect x={63} y={32} width={30} height={18} rx={4} fill="#7c3aed"/>
        <rect x={58} y={30} width={4} height={7} rx={2} fill="#c4b5fd"/>
        <rect x={93} y={30} width={4} height={7} rx={2} fill="#c4b5fd"/>
        <path d="M74 24 Q76 16 78 24" stroke={T.amber} strokeWidth="2.5" fill="none" opacity="0.9"/>
        <path d="M81 20 Q83 12 85 20" stroke={T.amber} strokeWidth="2.5" fill="none" opacity="0.9"/>
        <path d="M78 52 Q74 47 78 42 Q82 47 78 52Z" fill={T.amber} opacity="0.8"/>
        <path d="M107 52 Q103 47 107 42 Q111 47 107 52Z" fill={T.amber} opacity="0.8"/>
        <ellipse cx={22} cy={50} rx={15} ry={4} fill={T.purple} opacity="0.6"/>
        <rect x={9} y={22} width={26} height={28} rx={4} fill={T.purple} opacity="0.6"/>
        <ellipse cx={22} cy={22} rx={18} ry={9} fill="#c4b5fd" opacity="0.5"/>
      </svg>
      <div style={{fontSize:10,color:T.purple,fontWeight:800,textTransform:"uppercase",letterSpacing:2}}>KITCHEN</div>
      <div style={{fontSize:24,fontWeight:900,color:T.white,marginTop:2,lineHeight:1}}>Cooking Station</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5}}>
        <span style={{fontSize:12,color:T.mutedLt}}>Prepare & track orders 🔥</span>
        {queueCount>0&&<span style={{background:T.red,color:"#fff",borderRadius:10,padding:"2px 10px",fontSize:11,fontWeight:900}}>{queueCount} in queue</span>}
      </div>
    </div>
  );
}

function AdminBanner({ revenue, billingCount }) {
  return (
    <div style={{background:"linear-gradient(135deg,#1a1205,#241804)",borderBottom:`1px solid ${T.amber}33`,padding:"16px 16px 12px",position:"relative",overflow:"hidden"}}>
      <svg style={{position:"absolute",right:0,top:0,opacity:0.2}} width={130} height={88} viewBox="0 0 130 88">
        <rect x={60} y={10} width={65} height={72} rx={8} fill={T.amber}/>
        <rect x={70} y={52} width={9} height={22} rx={2} fill="#fff" opacity="0.5"/>
        <rect x={83} y={40} width={9} height={34} rx={2} fill="#fff" opacity="0.7"/>
        <rect x={96} y={30} width={9} height={44} rx={2} fill="#fff" opacity="0.9"/>
        <rect x={109} y={44} width={9} height={30} rx={2} fill="#fff" opacity="0.6"/>
        <rect x={70} y={18} width={35} height={6} rx={2} fill="#fff" opacity="0.5"/>
        <rect x={70} y={27} width={48} height={8} rx={2} fill="#fff" opacity="0.8"/>
        <circle cx={22} cy={45} r={20} fill={T.amber} opacity="0.4"/>
        <circle cx={22} cy={45} r={14} fill={T.amber} opacity="0.4"/>
        <text x={22} y={51} textAnchor="middle" fill="#fff" fontSize={18} fontWeight={900} opacity="0.9">₹</text>
        <path d="M9 20 L14 8 L22 15 L30 8 L35 20 L9 20Z" fill={T.amber} opacity="0.7"/>
        <rect x={9} y={20} width={26} height={7} rx={2} fill={T.amber} opacity="0.5"/>
      </svg>
      <div style={{fontSize:10,color:T.amber,fontWeight:800,textTransform:"uppercase",letterSpacing:2}}>ADMIN</div>
      <div style={{fontSize:24,fontWeight:900,color:T.white,marginTop:2,lineHeight:1}}>Dashboard</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5}}>
        <span style={{fontSize:12,color:T.mutedLt}}>Revenue: <b style={{color:T.amber}}>₹{Number(revenue||0).toLocaleString("en-IN")}</b></span>
        {billingCount>0&&<span style={{background:T.red,color:"#fff",borderRadius:10,padding:"2px 10px",fontSize:11,fontWeight:900}}>{billingCount} bill!</span>}
      </div>
    </div>
  );
}

function NotifList({ notifs, clear }) {
  if(!notifs.length) return null;
  return (
    <div style={{marginBottom:8}}>
      {notifs.map(n=>(
        <div key={n.id} style={S.notif}>
          <span style={{flex:1}}>{n.msg}</span>
          <button style={{...S.btnSm(T.green),marginTop:0,padding:"2px 10px",flexShrink:0}} onClick={()=>clear(n.id)}>OK</button>
        </div>
      ))}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username,setU]=useState(""); const [password,setP]=useState(""); const [err,setErr]=useState(""); const [loading,setL]=useState(false);
  const handle=async()=>{
    if(!username||!password) return setErr("Enter username and password");
    setL(true); setErr("");
    try{ const d=await apiFetch("/auth/login","POST",{username,password}); onLogin(d.token,d.user); }
    catch(e){ setErr(e.message); }
    finally{ setL(false); }
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 50% 0%,#0d1f3c,${T.bg} 65%)`}}>
      <div style={{background:T.bgCard,border:`1px solid ${T.borderHi}`,borderRadius:20,padding:36,width:320,textAlign:"center",boxShadow:`0 0 60px ${T.teal}18`}}>
        <div style={{width:64,height:64,borderRadius:18,background:T.tealGlow,border:`1px solid ${T.borderHi}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 18px"}}>🏨</div>
        <div style={{fontSize:26,fontWeight:900,color:T.teal,marginBottom:4}}>Hotel Manager</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:28}}>Restaurant Order System</div>
        <div style={{textAlign:"left",marginBottom:12}}>
          <div style={S.label}>Username</div>
          <input style={S.input} placeholder="admin / kitchen / waiter" value={username} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
        </div>
        <div style={{textAlign:"left",marginBottom:18}}>
          <div style={S.label}>Password</div>
          <input style={S.input} type="password" placeholder="••••••••" value={password} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
          <div style={{fontSize:10,color:T.border,marginTop:5}}>admin123 · kitchen123 · waiter123</div>
        </div>
        {err&&<div style={S.err}>{err}</div>}
        <button style={{...S.btn(),marginTop:0}} onClick={handle} disabled={loading}>{loading?"Signing in…":"Sign In →"}</button>
      </div>
    </div>
  );
}

// ─── WAITER VIEW ─────────────────────────────────────────────────────────────
function WaiterView({ orders, setOrders, menu, token, socket, notifs, clearNotif }) {
  const [tab,setTab]=useState("tables"); const [selTable,setST]=useState(""); const [cart,setCart]=useState([]); const [cat,setCat]=useState("All"); const [loading,setL]=useState(false);
  const activeOrders=orders.filter(o=>["Ready","Served","Bill Pending"].includes(o.status));
  const tblStatus=(t)=>{ const o=orders.find(x=>x.table_no===t&&x.status!=="Paid"); if(!o) return "Available"; if(o.status==="Ready") return "Ready!"; if(o.status==="Bill Pending") return "Billing"; return "Occupied"; };
  const tCol={ Available:T.green,Occupied:T.red,"Ready!":T.amber,Billing:T.purple };
  const addToCart=(item)=>setCart(c=>{ const ex=c.find(x=>x.id===item.id); return ex?c.map(x=>x.id===item.id?{...x,qty:x.qty+1}:x):[...c,{...item,qty:1}]; });
  const rem=(id)=>setCart(c=>c.map(x=>x.id===id?{...x,qty:x.qty-1}:x).filter(x=>x.qty>0));
  const placeOrder=async()=>{
    if(!cart.length||!selTable) return; setL(true);
    try{
      const order=await apiFetch("/orders","POST",{table_no:selTable,items:cart},token);
      setOrders(p=>[...p,order]);
      if(socket.current) socket.current.emit("new_order",order);
      setCart([]); setST(""); setTab("tables");
    }catch(e){alert(e.message);}finally{setL(false);}
  };
  const updateStatus=async(id,status)=>{
    try{
      await apiFetch(`/orders/${id}/status`,"PATCH",{status},token);
      const order=orders.find(o=>o.id===id);
      setOrders(p=>p.map(o=>o.id===id?{...o,status}:o));
      if(socket.current) socket.current.emit("status_changed",{order,newStatus:status});
    }catch(e){alert(e.message);}
  };
  const cats=["All",...new Set(menu.map(m=>m.category))];
  const filtMenu=cat==="All"?menu:menu.filter(m=>m.category===cat);
  const cartTotal=cart.reduce((s,i)=>s+i.price*i.qty,0);

  return (
    <div style={S.app}>
      <WaiterBanner/>
      <div style={S.nav}>
        {[["tables","🪑 Tables"],["order","📝 Order"],["active",`🍽️ Active${activeOrders.length>0?` (${activeOrders.length})`:""}`]].map(([k,l])=>(
          <button key={k} style={S.navBtn(tab===k,T.teal)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      <div style={S.body}>
        <NotifList notifs={notifs} clear={clearNotif}/>

        {tab==="tables"&&(
          <div>
            <div style={S.secTitle}>🪑 Tap any table to take order</div>
            <div style={S.grid3}>
              {TABLES.map(t=>{ const st=tblStatus(t); const c=tCol[st]||T.green; return (
                <div key={t} onClick={()=>{setST(t);setTab("order");}} style={{background:`${c}14`,border:`1px solid ${c}44`,borderRadius:12,padding:"14px 4px",textAlign:"center",cursor:"pointer"}}>
                  <div style={{fontSize:11,marginBottom:3}}>{st==="Available"?"🟢":st==="Ready!"?"🔔":st==="Billing"?"💳":"🔴"}</div>
                  <div style={{fontSize:20,fontWeight:900,color:c}}>{t}</div>
                  <div style={{fontSize:10,color:c,marginTop:3}}>{st}</div>
                </div>
              );})}
            </div>
            <div style={{marginTop:12,display:"flex",gap:12,flexWrap:"wrap"}}>
              {[["🟢 Free",T.green],["🔴 Busy",T.red],["🔔 Ready",T.amber],["💳 Bill",T.purple]].map(([l,c])=>(
                <span key={l} style={{fontSize:11,color:c}}>{l}</span>
              ))}
            </div>
          </div>
        )}

        {tab==="order"&&(
          <div>
            <div style={{marginBottom:12}}>
              <div style={S.label}>Select Table</div>
              <select style={S.select} value={selTable} onChange={e=>setST(e.target.value)}>
                <option value="">-- Choose Table --</option>
                {TABLES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {cats.map(c=><button key={c} style={{...S.btnSm(cat===c?T.teal:T.border,cat!==c),marginTop:0,fontSize:11}} onClick={()=>setCat(c)}>{c}</button>)}
            </div>
            <div style={S.card}>
              {filtMenu.map(item=>{ const ic=cart.find(x=>x.id===item.id); return (
                <div key={item.id} style={S.menuRow}>
                  <div><div style={{fontSize:14,fontWeight:600}}>{item.name}</div><div style={{fontSize:11,color:T.muted}}>{item.category} · ₹{item.price}</div></div>
                  {ic?(
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <button style={{...S.btnSm(T.border),marginTop:0,padding:"3px 10px"}} onClick={()=>rem(item.id)}>−</button>
                      <span style={{fontWeight:900,fontSize:15,minWidth:18,textAlign:"center"}}>{ic.qty}</span>
                      <button style={{...S.btnSm(T.teal),marginTop:0,padding:"3px 10px"}} onClick={()=>addToCart(item)}>+</button>
                    </div>
                  ):(
                    <button style={{...S.btnSm(T.teal),marginTop:0}} onClick={()=>addToCart(item)}>Add</button>
                  )}
                </div>
              );})}
            </div>
            {cart.length>0&&(
              <div style={S.cardHi}>
                <div style={S.secTitle}>🛒 Order Summary</div>
                {cart.map(i=>(<div key={i.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",color:T.mutedLt}}><span>{i.name} ×{i.qty}</span><span style={{color:T.teal,fontWeight:700}}>₹{i.price*i.qty}</span></div>))}
                <div style={S.divider}/>
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:16}}><span>Total</span><span style={{color:T.teal}}>₹{cartTotal}</span></div>
                <button style={{...S.btn(),marginTop:10}} onClick={placeOrder} disabled={!selTable||loading}>
                  {loading?"Sending…":selTable?`🍳 Send to Kitchen — Table ${selTable}`:"Select a table first"}
                </button>
              </div>
            )}
          </div>
        )}

        {tab==="active"&&(
          <div>
            {activeOrders.length===0&&<div style={S.loader}>No active orders right now</div>}
            {activeOrders.map(o=>(
              <div key={o.id} style={{...S.card,borderLeft:`3px solid ${SC[o.status]||T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div><span style={{fontWeight:900,fontSize:15,color:T.teal}}>#{o.id}</span><span style={{color:T.muted,marginLeft:8,fontSize:12}}>Table {o.table_no}</span></div>
                  <span style={S.badge(SC[o.status]||T.muted)}>{o.status}</span>
                </div>
                <div style={{fontSize:12,color:T.muted,marginBottom:8}}>{o.items?.map(i=>`${i.item_name}×${i.qty}`).join(", ")}</div>
                <div style={{fontWeight:900,color:T.white,fontSize:15,marginBottom:8}}>₹{Number(o.total).toLocaleString("en-IN")}</div>
                {o.status==="Ready"&&<button style={{...S.btn(T.green),marginTop:0}} onClick={()=>updateStatus(o.id,"Served")}>✅ Mark as Served</button>}
                {o.status==="Served"&&<button style={{...S.btn(T.purple),marginTop:0}} onClick={()=>updateStatus(o.id,"Bill Pending")}>🧾 Send Bill to Admin</button>}
                {o.status==="Bill Pending"&&<div style={{textAlign:"center",fontSize:12,color:T.muted,padding:6}}>⏳ Waiting for Admin to collect payment…</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KITCHEN VIEW ─────────────────────────────────────────────────────────────
function KitchenView({ orders, setOrders, token, socket, notifs, clearNotif }) {
  const queue=orders.filter(o=>["Created","Accepted","Preparing"].includes(o.status));
  const ready=orders.filter(o=>o.status==="Ready");
  const BTNS={ Created:[T.teal,"✅ Accept","Accepted"], Accepted:[T.purple,"🔥 Start Preparing","Preparing"], Preparing:[T.green,"🍽️ Mark Ready","Ready"] };

  const updateStatus=async(id,status)=>{
    try{
      await apiFetch(`/orders/${id}/status`,"PATCH",{status},token);
      const order=orders.find(o=>o.id===id);
      setOrders(p=>p.map(o=>o.id===id?{...o,status}:o));
      if(socket.current) socket.current.emit("status_changed",{order,newStatus:status});
    }catch(e){alert(e.message);}
  };

  return (
    <div style={S.app}>
      <KitchenBanner queueCount={queue.length}/>
      <div style={S.body}>
        <NotifList notifs={notifs} clear={clearNotif}/>
        <div style={S.grid3}>
          {[[T.amber,queue.length,"Queue"],[T.green,ready.length,"Ready"],[T.teal,orders.filter(o=>o.status==="Paid").length,"Done"]].map(([c,v,l])=>(
            <div key={l} style={{...S.card,textAlign:"center",borderColor:`${c}33`,padding:"12px 8px"}}>
              <div style={{fontSize:24,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
              <div style={{fontSize:10,color:T.muted,marginTop:4,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
            </div>
          ))}
        </div>

        {queue.length===0&&ready.length===0&&(
          <div style={{...S.card,textAlign:"center",padding:32}}>
            <div style={{fontSize:40,marginBottom:8}}>🎉</div>
            <div style={{color:T.muted,fontSize:14}}>Kitchen is clear! All orders done.</div>
          </div>
        )}

        {queue.length>0&&<div style={{fontSize:11,color:T.muted,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>📋 In Queue ({queue.length})</div>}
        {queue.map(o=>{ const [bc,bt,ns]=BTNS[o.status]||[]; return (
          <div key={o.id} style={{...S.card,borderLeft:`4px solid ${SC[o.status]||T.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div><span style={{fontWeight:900,fontSize:16}}>#{o.id}</span><span style={{color:T.muted,marginLeft:8,fontSize:13}}>Table {o.table_no}</span></div>
              <span style={S.badge(SC[o.status]||T.muted)}>{o.status}</span>
            </div>
            <div style={{background:T.bgCard3,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
              {o.items?.map(i=>(<div key={i.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`,fontSize:15}}>
                <span style={{fontWeight:700}}>{i.item_name}</span>
                <span style={{color:T.teal,fontWeight:900,fontSize:18}}>×{i.qty}</span>
              </div>))}
            </div>
            <div style={{fontSize:11,color:T.muted,marginBottom:10}}>⏰ {new Date(o.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
            {bt&&<button style={{...S.btn(bc),marginTop:0,fontSize:14,padding:"12px"}} onClick={()=>updateStatus(o.id,ns)}>{bt}</button>}
          </div>
        );})}

        {ready.length>0&&(
          <div>
            <div style={{fontSize:11,color:T.green,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>✅ Ready for Pickup ({ready.length})</div>
            {ready.map(o=>(
              <div key={o.id} style={{...S.card,borderColor:`${T.green}55`,background:`${T.green}08`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><span style={{fontWeight:900,color:T.green,fontSize:14}}>#{o.id}</span><span style={{color:T.muted,marginLeft:8,fontSize:12}}>Table {o.table_no}</span></div>
                  <span style={S.badge(T.green)}>Ready ✅</span>
                </div>
                <div style={{fontSize:12,color:T.muted,marginTop:6}}>{o.items?.map(i=>`${i.item_name}×${i.qty}`).join(" · ")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView({ orders, setOrders, menu, setMenu, token, socket, notifs, clearNotif }) {
  const [tab,setTab]=useState("dash"); const [selPay,setSP]=useState({});
  const billing=orders.filter(o=>o.status==="Bill Pending");
  const paidToday=orders.filter(o=>o.paid&&new Date(o.created_at).toDateString()===new Date().toDateString());
  const revenue=paidToday.reduce((s,o)=>s+Number(o.total),0);
  const payBd={}; paidToday.forEach(o=>{ const m=o.pay_method||"Other"; payBd[m]=(payBd[m]||0)+Number(o.total); });
  const ic={}; orders.forEach(o=>o.items?.forEach(i=>{ ic[i.item_name]=(ic[i.item_name]||0)+i.qty; }));
  const topItems=Object.entries(ic).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const collect=async(o)=>{
    const m=selPay[o.id]||"Cash";
    try{
      await apiFetch(`/orders/${o.id}/pay`,"PATCH",{pay_method:m},token);
      setOrders(p=>p.map(x=>x.id===o.id?{...x,status:"Paid",paid:true,pay_method:m}:x));
      if(socket.current) socket.current.emit("payment_done",{orderId:o.id,table:o.table_no,method:m});
    }catch(e){alert(e.message);}
  };

  const [mName,setMN]=useState(""); const [mPrice,setMP]=useState(""); const [mCat,setMC]=useState("Veg");
  const addMenuItem=async()=>{
    if(!mName||!mPrice) return;
    try{ const item=await apiFetch("/menu","POST",{name:mName,price:Number(mPrice),category:mCat},token); setMenu(p=>[...p,item]); setMN(""); setMP(""); }
    catch(e){alert(e.message);}
  };
  const removeMenuItem=async(id)=>{
    try{ await apiFetch(`/menu/${id}`,"DELETE",null,token); setMenu(p=>p.filter(x=>x.id!==id)); }
    catch(e){alert(e.message);}
  };

  return (
    <div style={S.app}>
      <AdminBanner revenue={revenue} billingCount={billing.length}/>
      <div style={S.nav}>
        {[["dash","📊 Dashboard"],["bill",`💳 Billing${billing.length>0?` (${billing.length})`:""}`],["menu","🍽️ Menu"],["orders","📋 Orders"]].map(([k,l])=>(
          <button key={k} style={S.navBtn(tab===k,T.amber)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      <div style={S.body}>
        <NotifList notifs={notifs} clear={clearNotif}/>

        {tab==="dash"&&(
          <div>
            <div style={{...S.card,borderColor:`${T.amber}44`,textAlign:"center",padding:"20px 16px",background:`linear-gradient(135deg,${T.bgCard2},${T.bgCard3})`}}>
              <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>Today's Revenue</div>
              <div style={{fontSize:44,fontWeight:900,color:T.amber,lineHeight:1,letterSpacing:-1}}>₹{revenue.toLocaleString("en-IN")}</div>
              <div style={{fontSize:12,color:T.muted,marginTop:6}}>{paidToday.length} orders paid today</div>
            </div>
            <div style={S.grid2}>
              {[[T.green,"✅",paidToday.length,"Paid"],[T.red,"⏳",orders.filter(o=>!o.paid).length,"Pending"],[T.teal,"📋",orders.length,"Total"],[T.purple,"🔥",orders.filter(o=>o.status==="Preparing").length,"Cooking"]].map(([c,ic,v,l])=>(
                <div key={l} style={{...S.card,borderColor:`${c}33`,display:"flex",alignItems:"center",gap:10,padding:12}}>
                  <div style={{fontSize:24}}>{ic}</div>
                  <div><div style={{fontSize:22,fontWeight:900,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{l}</div></div>
                </div>
              ))}
            </div>
            {Object.keys(payBd).length>0&&(
              <div style={S.card}>
                <div style={S.secTitle}>💳 Payment Breakdown</div>
                {Object.entries(payBd).map(([m,amt])=>{ const pct=revenue>0?Math.round((amt/revenue)*100):0; const c=PC[m]||T.muted; return (
                  <div key={m} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}><span style={{color:c,fontWeight:700}}>{PI[m]} {m}</span><span style={{color:T.white,fontWeight:700}}>₹{Number(amt).toLocaleString("en-IN")} <span style={{color:T.muted,fontWeight:400}}>({pct}%)</span></span></div>
                    <div style={{background:T.bgCard3,borderRadius:4,height:6}}><div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${c},${c}bb)`,borderRadius:4,transition:"width 0.6s",boxShadow:`0 0 8px ${c}66`}}/></div>
                  </div>
                );})}
              </div>
            )}
            {topItems.length>0&&(
              <div style={S.card}>
                <div style={S.secTitle}>🏆 Top Selling Items</div>
                {topItems.map(([name,qty],i)=>(
                  <div key={name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                    <div style={{width:24,height:24,borderRadius:6,background:[T.amber,"#94a3b8","#cd7f32",T.border,T.border][i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#000",flexShrink:0}}>{i+1}</div>
                    <span style={{flex:1,fontSize:13,fontWeight:600}}>{name}</span>
                    <span style={{fontSize:13,color:T.teal,fontWeight:800}}>{qty} sold</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==="bill"&&(
          <div>
            {billing.length===0&&<div style={{...S.card,textAlign:"center",padding:32}}><div style={{fontSize:40,marginBottom:8}}>🎉</div><div style={{color:T.muted}}>No bills pending!</div></div>}
            {billing.map(o=>(
              <div key={o.id} style={{...S.card,border:`1px solid ${T.red}44`,background:`${T.red}06`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                  <div><span style={{fontWeight:900,color:T.teal,fontSize:16}}>#{o.id}</span><span style={{color:T.muted,marginLeft:8,fontSize:12}}>Table {o.table_no}</span></div>
                  <span style={S.badge(T.red)}>Bill Pending</span>
                </div>
                {o.items?.map(i=>(<div key={i.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"3px 0",color:T.mutedLt}}><span>{i.item_name} ×{i.qty}</span><span>₹{i.price*i.qty}</span></div>))}
                <div style={S.divider}/>
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:18,marginBottom:14,color:T.white}}><span>Total</span><span style={{color:T.teal}}>₹{Number(o.total).toLocaleString("en-IN")}</span></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                  {PAY_METHODS.map(m=>{ const sel=(selPay[o.id]||"Cash")===m; const c=PC[m]||T.teal; return (
                    <button key={m} onClick={()=>setSP(s=>({...s,[o.id]:m}))} style={{background:sel?c:`${c}18`,color:sel?"#fff":c,border:`1px solid ${c}${sel?"":"55"}`,borderRadius:8,padding:"9px 4px",cursor:"pointer",fontSize:12,fontWeight:700,lineHeight:1.5}}>
                      {PI[m]}<br/>{m}
                    </button>
                  );})}
                </div>
                <button style={{...S.btn(T.green),marginTop:0,fontSize:14,padding:"13px"}} onClick={()=>collect(o)}>✅ Collect ₹{Number(o.total).toLocaleString("en-IN")} via {selPay[o.id]||"Cash"}</button>
              </div>
            ))}
            {paidToday.length>0&&(
              <div style={S.card}>
                <div style={S.secTitle}>✅ Paid Today ({paidToday.length})</div>
                {[...paidToday].reverse().map(o=>(
                  <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                    <div><span style={{color:T.teal,fontWeight:700}}>#{o.id}</span><span style={{color:T.muted,marginLeft:8,fontSize:12}}>Table {o.table_no}</span></div>
                    <div style={{textAlign:"right"}}><div style={{fontWeight:900,color:T.green}}>₹{Number(o.total).toLocaleString("en-IN")}</div><div style={{fontSize:11,color:PC[o.pay_method]||T.muted,fontWeight:700}}>{PI[o.pay_method]} {o.pay_method}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==="menu"&&(
          <div>
            <div style={S.cardHi}>
              <div style={S.secTitle}>➕ Add Menu Item</div>
              <input style={{...S.input,marginBottom:10}} placeholder="Item name" value={mName} onChange={e=>setMN(e.target.value)}/>
              <div style={{...S.grid2,marginBottom:10}}>
                <input style={S.input} placeholder="₹ Price" type="number" value={mPrice} onChange={e=>setMP(e.target.value)}/>
                <select style={S.select} value={mCat} onChange={e=>setMC(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
              </div>
              <button style={{...S.btn(),marginTop:0}} onClick={addMenuItem}>Add to Menu</button>
            </div>
            {CATEGORIES.map(c=>{ const items=menu.filter(m=>m.category===c); if(!items.length) return null; return (
              <div key={c} style={S.card}>
                <div style={{fontSize:11,fontWeight:700,color:T.teal,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>{c} ({items.length})</div>
                {items.map(m=>(
                  <div key={m.id} style={S.menuRow}>
                    <div style={{fontSize:14,fontWeight:600}}>{m.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{color:T.teal,fontWeight:800}}>₹{m.price}</span>
                      <button style={{...S.btnSm(T.red,true),marginTop:0,padding:"3px 10px",fontSize:11}} onClick={()=>removeMenuItem(m.id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            );})}
          </div>
        )}

        {tab==="orders"&&(
          <div>
            <div style={S.secTitle}>📋 All Orders ({orders.length})</div>
            {orders.length===0&&<div style={S.loader}>No orders yet</div>}
            {[...orders].reverse().map(o=>(
              <div key={o.id} style={{...S.card,borderLeft:`3px solid ${SC[o.status]||T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div><span style={{fontWeight:900,color:T.teal,fontSize:13}}>#{o.id}</span><span style={{color:T.muted,fontSize:12,marginLeft:8}}>Table {o.table_no}</span><span style={{color:T.muted,fontSize:11,marginLeft:8}}>{new Date(o.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span></div>
                  <span style={S.badge(SC[o.status]||T.muted)}>{o.status}</span>
                </div>
                <div style={{fontSize:12,color:T.muted,marginBottom:6}}>{o.items?.map(i=>`${i.item_name}×${i.qty}`).join(", ")}</div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                  <span style={{fontWeight:900,color:T.white}}>₹{Number(o.total).toLocaleString("en-IN")}</span>
                  {o.pay_method&&<span style={{color:PC[o.pay_method]||T.muted,fontWeight:700}}>{PI[o.pay_method]} {o.pay_method}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function App() {
  const savedToken = localStorage.getItem("hotel_token");
  const savedUser  = localStorage.getItem("hotel_user");

  const [token,  setToken]  = useState(savedToken||null);
  const [user,   setUser]   = useState(savedUser?JSON.parse(savedUser):null);
  const [orders, setOrders] = useState([]);
  const [menu,   setMenu]   = useState([]);
  const [loading,setLoading]= useState(false);
  const [notifs, setNotifs] = useState([]);

  const addNotif   = useCallback((msg)=>setNotifs(n=>[...n,{id:Date.now()+Math.random(),msg}]),[]);
  const clearNotif = (id)=>setNotifs(n=>n.filter(x=>x.id!==id));

  const socketHandlers = {
    order_received: (o)=>{ setOrders(p=>[...p,o]); addNotif(`🆕 New order #${o.id} — Table ${o.table_no}`); },
    order_update:   (o)=>setOrders(p=>p.map(x=>x.id===o.id?{...x,...o}:x)),
    food_ready:     ({msg})=>addNotif(msg),
    bill_request:   ({msg})=>addNotif(msg),
    table_cleared:  ({msg})=>addNotif(msg),
    order_closed:   (id)=>setOrders(p=>p.map(o=>o.id===id?{...o,status:"Paid"}:o)),
  };
  const socket = useSocket(user?.role, socketHandlers);

  useEffect(()=>{
    if(savedToken&&savedUser){
      setLoading(true);
      Promise.all([apiFetch("/orders","GET",null,savedToken),apiFetch("/menu","GET",null,savedToken)])
        .then(([o,m])=>{ setOrders(o); setMenu(m); })
        .catch(()=>{ localStorage.removeItem("hotel_token"); localStorage.removeItem("hotel_user"); setToken(null); setUser(null); })
        .finally(()=>setLoading(false));
    }
  },[]);

  const login=async(t,u)=>{
    localStorage.setItem("hotel_token",t); localStorage.setItem("hotel_user",JSON.stringify(u));
    setToken(t); setUser(u); setLoading(true);
    try{ const [o,m]=await Promise.all([apiFetch("/orders","GET",null,t),apiFetch("/menu","GET",null,t)]); setOrders(o); setMenu(m); }
    catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  const logout=()=>{
    localStorage.removeItem("hotel_token"); localStorage.removeItem("hotel_user");
    setToken(null); setUser(null); setOrders([]); setMenu([]); setNotifs([]);
  };

  if(!user) return <LoginScreen onLogin={login}/>;
  if(loading) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.bg,gap:16}}>
      <div style={{fontSize:44}}>🏨</div>
      <div style={{color:T.teal,fontSize:16,fontWeight:700}}>Loading…</div>
    </div>
  );

  const sharedProps={ orders, setOrders, menu, token, socket, notifs, clearNotif };

  return (
    <div>
      {/* Logout button overlay for all views */}
      <div style={{position:"fixed",top:12,right:14,zIndex:999,display:"flex",alignItems:"center",gap:8}}>
        <div style={S.roleBadge}>{user.name}</div>
        <button style={S.logoutBtn} onClick={logout}>Logout</button>
      </div>

      {user.role==="waiter"  && <WaiterView  {...sharedProps}/>}
      {user.role==="kitchen" && <KitchenView {...sharedProps}/>}
      {user.role==="admin"   && <AdminView   {...sharedProps} setMenu={setMenu}/>}
    </div>
  );
}
