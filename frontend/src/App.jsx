import { useState, useEffect, useRef, useCallback } from "react";

const HOST = window.location.hostname;
const API_BASE = import.meta.env.VITE_API_URL || (window.location.port === "5173" ? `http://${HOST}:4000` : window.location.origin);
const API  = `${API_BASE}/api`;
const WS   = import.meta.env.VITE_WS_URL || API_BASE;

const T={bg:"#060d18",bgCard:"#0b1628",bgCard2:"#0f1e35",bgCard3:"#132240",border:"#1a3050",borderHi:"#0ea5e955",teal:"#0ea5e9",tealGlow:"#0ea5e918",white:"#f0f9ff",muted:"#4e6a8a",mutedLt:"#7a9ab8",green:"#10b981",red:"#f43f5e",amber:"#f59e0b",purple:"#8b5cf6",cyan:"#06b6d4",pink:"#ec4899"};
const SC={Created:"#f59e0b",Accepted:"#0ea5e9",Preparing:"#8b5cf6",Ready:"#10b981",Served:"#06b6d4","Bill Pending":"#f43f5e",Paid:"#10b981",Cancelled:"#ef4444"};
const PC={Cash:T.green,GPay:T.teal,PhonePe:T.purple,Card:T.amber,UPI:T.cyan};
const PI={Cash:"💵",GPay:"📱",PhonePe:"📲",Card:"💳",UPI:"🔗"};
const TABLES=["A1","A2","A3","B1","B2","B3","C1","C2"];
const PMETHODS=["Cash","GPay","PhonePe","Card","UPI"];
const CATEGORIES=["Veg","Non-Veg","Drinks","Desserts"];
const COLORS=[T.amber,T.teal,T.purple,T.green,T.cyan,T.pink];

const apiFetch = async (path, method="GET", body=null, token=null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

function useSocket(role, handlers) {
  const ref = useRef(null);
  useEffect(() => {
    if (!role) return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.6.2/socket.io.min.js";
    s.onload = () => {
      const sock = window.io(WS, { transports: ["websocket","polling"] });
      ref.current = sock;
      sock.on("connect", () => sock.emit("join_room", role));
      Object.entries(handlers).forEach(([ev,fn]) => sock.on(ev, fn));
    };
    document.head.appendChild(s);
    return () => { if (ref.current) ref.current.disconnect(); try { document.head.removeChild(s); } catch {} };
  }, [role]);
  return ref;
}

const S={
  app:{fontFamily:"Inter,system-ui,sans-serif",background:T.bg,minHeight:"100vh",color:T.white},
  card:{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:12,padding:14,marginBottom:10},
  chi:{background:T.bgCard2,border:"1px solid "+T.borderHi,borderRadius:12,padding:14,marginBottom:10},
  inp:{background:T.bgCard3,border:"1px solid "+T.border,borderRadius:8,padding:"9px 12px",color:T.white,fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"},
  inpR:{background:T.bgCard3,border:"1px solid #f43f5e88",borderRadius:8,padding:"9px 12px",color:T.white,fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"},
  sel:{background:T.bgCard3,border:"1px solid "+T.border,borderRadius:8,padding:"9px 12px",color:T.white,fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"},
  btn:(c)=>({background:c||T.teal,color:"#fff",border:"none",borderRadius:10,padding:"11px 18px",cursor:"pointer",fontWeight:700,fontSize:13,width:"100%",marginTop:8}),
  bsm:(c,o)=>({background:o?"transparent":(c||T.teal),color:o?(c||T.teal):"#fff",border:"1px solid "+(c||T.teal)+(o?"88":""),borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600}),
  bdg:(c)=>({display:"inline-block",background:c+"22",color:c,border:"1px solid "+c+"44",borderRadius:10,padding:"2px 10px",fontSize:10,fontWeight:700}),
  lbl:{fontSize:10,color:T.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:1.5},
  row:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid "+T.border},
  g2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},
  g3:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7},
  div:{borderTop:"1px solid "+T.border,margin:"10px 0"},
  notif:{background:T.green+"15",border:"1px solid "+T.green+"44",borderRadius:10,padding:"9px 13px",marginBottom:7,fontSize:12,color:"#6ee7b7",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8},
};

// Inject hover CSS
(function(){
  if(document.getElementById("hf-style")) return;
  const s=document.createElement("style");
  s.id="hf-style";
  s.innerHTML=`
    .hov-card{transition:transform .18s ease,box-shadow .18s ease;}
    .hov-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(14,165,233,0.15);}
    .hov-stat{transition:transform .18s ease,box-shadow .18s ease;}
    .hov-stat:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 10px 28px rgba(0,0,0,0.25);}
    .hov-btn{transition:transform .15s ease,box-shadow .15s ease;}
    .hov-btn:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.3);}
    .hov-pay{transition:transform .15s ease,box-shadow .15s ease;}
    .hov-pay:hover{transform:scale(1.05);box-shadow:0 4px 14px rgba(0,0,0,0.3);}
    .hov-side:hover{background:rgba(245,158,11,0.12)!important;color:#f59e0b!important;}
  `;
  document.head.appendChild(s);
})();

function Toast({msg,color}){
  if(!msg) return null;
  return <div style={{background:(color||T.green)+"18",border:"1px solid "+(color||T.green)+"55",borderRadius:10,padding:"9px 13px",marginBottom:8,fontSize:12,color:color||T.green,fontWeight:600,textAlign:"center"}}>{msg}</div>;
}
function NotifList({notifs,clear}){
  if(!notifs.length) return null;
  return <div style={{marginBottom:8}}>{notifs.map(n=><div key={n.id} style={S.notif}><span style={{flex:1}}>{n.msg}</span><button style={{...S.bsm(T.green),marginTop:0,padding:"2px 8px"}} onClick={()=>clear(n.id)}>OK</button></div>)}</div>;
}
function StatCard({label,value,color,sub}){
  return(
    <div className="hov-stat" style={{background:"linear-gradient(135deg,"+T.bgCard2+","+T.bgCard3+")",border:"1px solid "+(color||T.teal)+"44",borderRadius:14,padding:"14px 12px",overflow:"hidden"}}>
      <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>{label}</div>
      <div style={{fontSize:24,fontWeight:900,color:color||T.teal,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:T.muted,marginTop:5}}>{sub}</div>}
    </div>
  );
}
function BarChart({data,color}){
  const c=color||T.amber;
  if(!data?.length||!data.some(d=>d.v>0)) return <div style={{textAlign:"center",padding:16,color:T.muted,fontSize:12}}>No data for this period</div>;
  const mx=Math.max(...data.map(d=>d.v),1);
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:90,marginTop:10}}>
      {data.map((d,i)=>{
        const pct=Math.round((d.v/mx)*100);
        return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{fontSize:8,color:c,fontWeight:700,height:12}}>{d.v>0?(d.v>=1000?"₹"+(d.v/1000).toFixed(1)+"k":"₹"+d.v):""}</div>
            <div style={{width:"100%",background:c+"15",borderRadius:"4px 4px 0 0",flex:1,display:"flex",alignItems:"flex-end"}}>
              <div style={{width:"100%",background:c,borderRadius:"4px 4px 0 0",height:Math.max(pct,d.v>0?8:0)+"%"}}/>
            </div>
            <div style={{fontSize:8,color:T.muted,whiteSpace:"nowrap"}}>{d.l}</div>
          </div>
        );
      })}
    </div>
  );
}

// LOGIN
function LoginScreen({onLogin}){
  const [username,setU]=useState(""); const [password,setP]=useState(""); const [err,setErr]=useState(""); const [loading,setL]=useState(false);
  const handle=async()=>{
    if(!username||!password) return setErr("Enter username and password");
    setL(true); setErr("");
    try { const d=await apiFetch("/auth/login","POST",{username,password}); onLogin(d.token,d.user); }
    catch(e){ setErr(e.message); } finally { setL(false); }
  };
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 50% 0%,#0d1f3c,${T.bg} 65%)`}}>
      <div style={{background:T.bgCard,border:"1px solid "+T.borderHi,borderRadius:20,padding:36,width:320,textAlign:"center",boxShadow:"0 0 60px "+T.teal+"18"}}>
        <div style={{width:64,height:64,borderRadius:18,background:T.tealGlow,border:"1px solid "+T.borderHi,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 18px"}}>🏨</div>
        <div style={{fontSize:26,fontWeight:900,color:T.teal,marginBottom:4}}>Hotel Manager</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:28}}>Restaurant Order System V2</div>
        <div style={{textAlign:"left",marginBottom:12}}>
          <div style={S.lbl}>Username</div>
          <input style={S.inp} placeholder="admin / kitchen / waiter" value={username} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
        </div>
        <div style={{textAlign:"left",marginBottom:18}}>
          <div style={S.lbl}>Password</div>
          <input style={S.inp} type="password" placeholder="password" value={password} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
        </div>
        {err&&<div style={{color:T.red,fontSize:13,marginBottom:8}}>{err}</div>}
        <button className="hov-btn" style={{...S.btn(),marginTop:0}} onClick={handle} disabled={loading}>{loading?"Signing in...":"Sign In"}</button>
      </div>
    </div>
  );
}

// WAITER VIEW
function WaiterView({orders,setOrders,menu,token,socket,notifs,clearNotif,soldOut=[]}){
  const [tab,setTab]=useState("tables");
  const [selTable,setST]=useState("");
  const [cart,setCart]=useState([]);
  const [cat,setCat]=useState("All");
  const [orderNote,setOrderNote]=useState("");
  const [itemNotes,setItemNotes]=useState({});
  const [msg,setMsg]=useState(null);
  const [cModal,setCModal]=useState(null);
  const showMsg=(text,color)=>{setMsg({text,color});setTimeout(()=>setMsg(null),2500);};

  const active=orders.filter(o=>["Created","Accepted","Preparing","Ready","Served","Bill Pending"].includes(o.status));
  const cancelled=orders.filter(o=>o.status==="Cancelled");

  const tblSt=(t)=>{
    const o=orders.find(x=>x.table_no===t&&!["Paid","Cancelled"].includes(x.status));
    if(!o) return "Available";
    if(o.status==="Ready") return "Ready";
    if(o.status==="Bill Pending") return "Billing";
    return "Occupied";
  };
  const tCol={Available:T.green,Occupied:T.red,Ready:T.amber,Billing:T.purple};
  const addC=(item)=>setCart(c=>{const ex=c.find(x=>x.id===item.id);return ex?c.map(x=>x.id===item.id?{...x,qty:x.qty+1}:x):[...c,{...item,qty:1}];});
  const remC=(id)=>setCart(c=>c.map(x=>x.id===id?{...x,qty:x.qty-1}:x).filter(x=>x.qty>0));

  const existingOrder=orders.find(o=>o.table_no===selTable&&["Created","Accepted","Preparing"].includes(o.status));

  const placeOrder=async(addToExisting)=>{
    if(!cart.length||!selTable) return;
    if(addToExisting&&existingOrder){
      const newItems=cart.map((i,x)=>({id:existingOrder.items.length+x,item_name:i.name,price:i.price,qty:i.qty,special_instruction:itemNotes[i.id]||""}));
      const addAmt=cart.reduce((s,i)=>s+i.price*i.qty,0);
      setOrders(p=>p.map(o=>o.id===existingOrder.id?{...o,items:[...o.items,...newItems],total:Number(o.total)+addAmt}:o));
      if(socket.current) socket.current.emit("new_order",{...existingOrder,items:[...existingOrder.items,...newItems]});
      setCart([]);setST("");setOrderNote("");setItemNotes({});setTab("active");
      return;
    }
    try {
      const order=await apiFetch("/orders","POST",{table_no:selTable,order_source:"staff",special_instruction:orderNote,items:cart.map(i=>({...i,name:i.name,special_instruction:itemNotes[i.id]||""}))},token);
      setOrders(p=>[...p,order]);
      if(socket.current) socket.current.emit("new_order",order);
      setCart([]);setST("");setOrderNote("");setItemNotes({});setTab("tables");
    } catch(e){ showMsg(e.message,T.red); }
  };

  const updStatus=async(id,status,cancel_reason)=>{
    try {
      await apiFetch(`/orders/${id}/status`,"PATCH",{status,cancel_reason},token);
      setOrders(p=>p.map(o=>o.id===id?{...o,status,cancel_reason}:o));
      const order=orders.find(o=>o.id===id);
      if(socket.current) socket.current.emit("status_changed",{order,newStatus:status});
      if(status==="Bill Pending"&&socket.current) socket.current.emit("status_changed",{order:{...order,table_no:order?.table_no},newStatus:"Bill Pending"});
    } catch(e){ showMsg(e.message,T.red); }
  };

  const openCancel=(orderId,mode,itemId)=>{
    const o=orders.find(x=>x.id===orderId);
    if(!o) return;
    if(["Ready","Served","Bill Pending","Paid"].includes(o.status)){showMsg("Cannot cancel - Kitchen already marked Ready",T.red);return;}
    setCModal({orderId,mode:mode||"full",itemId:itemId||null,reason:""});
  };
  const doCancel=async()=>{
    if(!cModal||!cModal.reason) return;
    const{orderId,mode,itemId,reason}=cModal;
    if(mode==="full"){
      await updStatus(orderId,"Cancelled",reason);
    } else {
      setOrders(p=>p.map(o=>{
        if(o.id!==orderId) return o;
        const newItems=o.items.filter(i=>i.id!==itemId);
        const newTotal=newItems.reduce((s,i)=>s+i.price*i.qty,0);
        if(newItems.length===0){updStatus(orderId,"Cancelled",reason);return{...o,items:newItems,total:0,status:"Cancelled",cancel_reason:reason};}
        return{...o,items:newItems,total:newTotal};
      }));
    }
    setCModal(null);
  };

  const fcats=["All",...new Set(menu.map(m=>m.category))];
  const fmenu=cat==="All"?menu:menu.filter(m=>m.category===cat);
  const ctotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const TABS=[["tables","Tables"],["order","Order"],["active","Active"+(active.length>0?" ("+active.length+")":"")],["cancelled","Cancelled"+(cancelled.length>0?" ("+cancelled.length+")":"")]];

  return(
    <div style={S.app}>
      <div style={{background:"linear-gradient(135deg,#051a28,#072436)",borderBottom:"1px solid "+T.teal+"33",padding:"14px 16px 11px"}}>
        <div style={{fontSize:10,color:T.teal,fontWeight:800,textTransform:"uppercase",letterSpacing:2}}>WAITER</div>
        <div style={{fontSize:22,fontWeight:900,color:T.white,marginTop:2}}>Table Orders</div>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid "+T.border,background:T.bgCard,overflowX:"auto"}}>
        {TABS.map(([k,l])=><button key={k} style={{flex:1,background:tab===k?T.teal+"18":"transparent",color:tab===k?T.teal:T.muted,border:"none",borderBottom:"2px solid "+(tab===k?T.teal:"transparent"),padding:"10px 6px",cursor:"pointer",fontWeight:tab===k?700:400,fontSize:11,whiteSpace:"nowrap",minWidth:70}} onClick={()=>setTab(k)}>{l}</button>)}
      </div>
      <div style={{padding:14}}>
        <Toast msg={msg?msg.text:null} color={msg?msg.color:null}/>
        <NotifList notifs={notifs} clear={clearNotif}/>

        {tab==="tables"&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:10}}>Tap a table to take order</div>
            <div style={S.g3}>
              {TABLES.map(t=>{const st=tblSt(t),c=tCol[st]||T.green;return(
                <div key={t} className="hov-card" onClick={()=>{setST(t);setTab("order");}} style={{background:c+"14",border:"1px solid "+c+"44",borderRadius:12,padding:"13px 4px",textAlign:"center",cursor:"pointer"}}>
                  <div style={{fontSize:19,fontWeight:900,color:c}}>{t}</div>
                  <div style={{fontSize:9,color:c,marginTop:2}}>{st}</div>
                </div>
              );})}
            </div>
          </div>
        )}

        {tab==="order"&&(
          <div>
            <div style={{marginBottom:10}}><div style={S.lbl}>Select Table</div><select style={S.sel} value={selTable} onChange={e=>setST(e.target.value)}><option value="">-- Choose Table --</option>{TABLES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>{fcats.map(c=><button key={c} style={{...S.bsm(cat===c?T.teal:T.border,cat!==c),marginTop:0,fontSize:10}} onClick={()=>setCat(c)}>{c}</button>)}</div>
            <div style={S.card}>
              {fmenu.map(item=>{const ic=cart.find(x=>x.id===item.id),isSO=soldOut.includes(item.id);return(
                <div key={item.id}>
                  <div style={{...S.row,opacity:isSO?0.6:1}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:isSO?T.muted:T.white}}>{item.name}{isSO&&<span style={{marginLeft:6,background:T.red+"22",color:T.red,borderRadius:6,padding:"1px 6px",fontSize:9,fontWeight:700}}>SOLD OUT</span>}</div>
                      <div style={{fontSize:10,color:T.muted,marginTop:2}}>{item.category} - ₹{item.price}</div>
                    </div>
                    {isSO?<div style={{fontSize:10,color:T.red}}>Not Available</div>
                    :ic?<div style={{display:"flex",alignItems:"center",gap:6}}>
                      <button style={{...S.bsm(T.border),marginTop:0,padding:"3px 9px"}} onClick={()=>remC(item.id)}>-</button>
                      <span style={{fontWeight:900,fontSize:14,minWidth:16,textAlign:"center"}}>{ic.qty}</span>
                      <button style={{...S.bsm(T.teal),marginTop:0,padding:"3px 9px"}} onClick={()=>addC(item)}>+</button>
                    </div>:<button style={{...S.bsm(T.teal),marginTop:0}} onClick={()=>addC(item)}>Add</button>}
                  </div>
                  {ic&&!isSO&&<div style={{paddingBottom:7}}><input style={{...S.inp,fontSize:11,padding:"5px 9px",marginTop:3,borderColor:T.amber+"44"}} placeholder={"Note for "+item.name} value={itemNotes[item.id]||""} onChange={e=>setItemNotes(n=>({...n,[item.id]:e.target.value}))}/></div>}
                </div>
              );})}
            </div>
            {cart.length>0&&(
              <div style={S.chi}>
                <div style={{fontSize:13,fontWeight:700,color:T.teal,marginBottom:8}}>Order Summary</div>
                {cart.map(i=><div key={i.id} style={{marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.mutedLt}}><span>{i.name} x{i.qty}</span><span style={{color:T.teal,fontWeight:700}}>₹{i.price*i.qty}</span></div>{itemNotes[i.id]&&<div style={{fontSize:10,color:T.amber}}>Note: {itemNotes[i.id]}</div>}</div>)}
                <div style={S.div}/>
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:15,marginBottom:10}}><span>Subtotal</span><span style={{color:T.teal}}>₹{ctotal}</span></div>
                <div style={{marginBottom:10}}><div style={S.lbl}>Overall Order Note (Optional)</div><input style={{...S.inp,borderColor:T.amber+"44",fontSize:12}} placeholder="e.g. Urgent - VIP table" value={orderNote} onChange={e=>setOrderNote(e.target.value)}/></div>
                {selTable&&existingOrder?(
                  <div>
                    <div style={{background:T.amber+"18",border:"1px solid "+T.amber+"44",borderRadius:10,padding:"9px 12px",marginBottom:8,fontSize:12,color:T.amber}}>Table {selTable} has active order ({existingOrder.kot_number})</div>
                    <div style={S.g2}>
                      <button className="hov-btn" style={{...S.btn(T.teal),marginTop:0,fontSize:12}} onClick={()=>placeOrder(true)}>+ Add to Existing Bill</button>
                      <button className="hov-btn" style={{...S.btn(T.purple),marginTop:0,fontSize:12}} onClick={()=>placeOrder(false)}>New Separate Order</button>
                    </div>
                  </div>
                ):(
                  <button className="hov-btn" style={{...S.btn(),marginTop:0}} onClick={()=>placeOrder(false)} disabled={!selTable}>{selTable?"Send to Kitchen - Table "+selTable:"Select a table first"}</button>
                )}
              </div>
            )}
          </div>
        )}

        {tab==="active"&&(
          <div>
            {active.length===0&&<div style={{color:T.muted,textAlign:"center",padding:24}}>No active orders</div>}
            {active.map(o=>(
              <div key={o.id} className="hov-card" style={{...S.card,borderLeft:"3px solid "+(SC[o.status]||T.border)}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div><span style={{fontWeight:900,fontSize:14,color:T.teal}}>#{o.id}</span><span style={{color:T.muted,marginLeft:6,fontSize:11}}>Table {o.table_no}</span>{o.kot_number&&<span style={{color:T.purple,marginLeft:6,fontSize:9,fontWeight:700}}>{o.kot_number}</span>}</div>
                  <span style={S.bdg(SC[o.status]||T.muted)}>{o.status}</span>
                </div>
                {o.special_instruction&&<div style={{fontSize:10,color:T.amber,marginBottom:5}}>Note: {o.special_instruction}</div>}
                <div style={{fontSize:11,color:T.muted,marginBottom:6}}>{(o.items||[]).map(i=>i.item_name+"x"+i.qty).join(", ")}</div>
                <div style={{fontWeight:900,color:T.white,marginBottom:8}}>₹{Number(o.total).toLocaleString("en-IN")}</div>
                {o.status==="Ready"&&<button className="hov-btn" style={{...S.btn(T.green),marginTop:0,fontSize:12}} onClick={()=>updStatus(o.id,"Served")}>Mark as Served</button>}
                {o.status==="Served"&&<button className="hov-btn" style={{...S.btn(T.purple),marginTop:0,fontSize:12}} onClick={()=>updStatus(o.id,"Bill Pending")}>Send Bill to Admin</button>}
                {o.status==="Bill Pending"&&<div style={{textAlign:"center",fontSize:11,color:T.muted,padding:4}}>Waiting for Admin...</div>}
                {["Created","Accepted","Preparing"].includes(o.status)&&(
                  <div style={{marginTop:8}}>
                    <div style={{fontSize:10,color:T.muted,marginBottom:6,textAlign:"center",padding:"4px 8px",background:T.bgCard3,borderRadius:6}}>{o.status==="Created"?"Waiting for kitchen":o.status==="Accepted"?"Accepted - can cancel":"Preparing"}</div>
                    {(o.items||[]).length>1&&<div style={{marginBottom:8}}><div style={{fontSize:10,color:T.amber,fontWeight:700,marginBottom:5}}>Remove specific item:</div>{(o.items||[]).map(item=><div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bgCard3,borderRadius:7,padding:"6px 9px",marginBottom:4}}><span style={{fontSize:12,color:T.white}}>{item.item_name} x{item.qty}</span><button style={{...S.bsm(T.red,true),marginTop:0,padding:"2px 9px",fontSize:10}} onClick={()=>openCancel(o.id,"item",item.id)}>Remove</button></div>)}</div>}
                    <button style={{...S.btn(T.red),marginTop:0,fontSize:12,padding:"9px"}} onClick={()=>openCancel(o.id,"full",null)}>Cancel Entire Order</button>
                  </div>
                )}
                {["Ready","Served","Bill Pending"].includes(o.status)&&<div style={{background:T.red+"10",border:"1px solid "+T.red+"33",borderRadius:8,padding:"6px 10px",marginTop:6,textAlign:"center",fontSize:10,color:T.red}}>Cannot cancel - Kitchen already marked Ready</div>}
              </div>
            ))}
          </div>
        )}

        {tab==="cancelled"&&(
          <div>
            {cancelled.length===0&&<div style={{...S.card,textAlign:"center",padding:28,color:T.muted}}>No cancelled orders</div>}
            {[...cancelled].reverse().map(o=>(
              <div key={o.id} style={{...S.card,borderLeft:"3px solid "+T.red,opacity:0.85}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div><span style={{fontWeight:900,fontSize:14,color:T.red}}>#{o.id}</span><span style={{color:T.muted,marginLeft:6,fontSize:11}}>Table {o.table_no}</span></div>
                  <span style={S.bdg(T.red)}>Cancelled</span>
                </div>
                <div style={{fontSize:11,color:T.muted,marginBottom:5}}>{(o.items&&o.items.length>0)?o.items.map(i=>i.item_name+"x"+i.qty).join(", "):"All items removed"}</div>
                <div style={{fontWeight:700,color:T.white,marginBottom:o.cancel_reason?6:0}}>₹{Number(o.total).toLocaleString("en-IN")}</div>
                {o.cancel_reason&&<div style={{background:T.red+"12",border:"1px solid "+T.red+"33",borderRadius:7,padding:"5px 9px",fontSize:11,color:T.red}}>Reason: {o.cancel_reason}</div>}
              </div>
            ))}
          </div>
        )}

        {cModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div style={{background:T.bgCard,border:"1px solid "+T.red+"55",borderRadius:"16px 16px 0 0",padding:20,width:"100%",maxWidth:420,maxHeight:"80vh",overflowY:"auto"}}>
              <div style={{fontSize:15,fontWeight:900,color:T.red,marginBottom:4}}>{cModal.mode==="full"?"Cancel Entire Order":"Remove Item"}</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:14}}>Select a reason to continue</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
                {["Customer changed mind","Wrong item ordered","Customer left","Duplicate order","Other"].map(r=>(
                  <button key={r} onClick={()=>setCModal(m=>({...m,reason:r}))} style={{background:cModal.reason===r?T.red+"33":T.bgCard3,border:"1px solid "+(cModal.reason===r?T.red:T.border),borderRadius:8,padding:"9px 12px",cursor:"pointer",color:cModal.reason===r?T.red:T.white,fontSize:13,textAlign:"left",fontWeight:cModal.reason===r?700:400}}>{r}</button>
                ))}
              </div>
              <div style={S.g2}>
                <button style={{...S.btn(T.bgCard3),marginTop:0,color:T.white,border:"1px solid "+T.border}} onClick={()=>setCModal(null)}>Go Back</button>
                <button style={{...S.btn(cModal.reason?T.red:T.muted),marginTop:0,opacity:cModal.reason?1:0.5}} onClick={doCancel} disabled={!cModal.reason}>Confirm Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// KITCHEN VIEW
function KitchenView({orders,setOrders,menu,token,socket,notifs,clearNotif,soldOut=[],setSoldOut}){
  const [ktab,setKtab]=useState("orders");
  const queue=orders.filter(o=>["Created","Accepted","Preparing"].includes(o.status));
  const ready=orders.filter(o=>o.status==="Ready");

  const updStatus=async(id,status)=>{
    try {
      await apiFetch(`/orders/${id}/status`,"PATCH",{status},token);
      const order=orders.find(o=>o.id===id);
      setOrders(p=>p.map(o=>o.id===id?{...o,status}:o));
      if(socket.current) socket.current.emit("status_changed",{order,newStatus:status});
    } catch(e){ console.error(e); }
  };
  const toggleSO=(id)=>setSoldOut(p=>{
    const updated=p.includes(id)?p.filter(x=>x!==id):[...p,id];
    try{localStorage.setItem("hotel_soldout",JSON.stringify(updated));}catch{}
    if(socket?.current) socket.current.emit("sold_out_update",updated);
    return updated;
  });

  return(
    <div style={S.app}>
      <div style={{background:"linear-gradient(135deg,#120820,#1c0d30)",borderBottom:"1px solid "+T.purple+"33",padding:"14px 16px 11px"}}>
        <div style={{fontSize:10,color:T.purple,fontWeight:800,textTransform:"uppercase",letterSpacing:2}}>KITCHEN</div>
        <div style={{fontSize:22,fontWeight:900,color:T.white,marginTop:2,display:"flex",alignItems:"center",gap:10}}>Cooking Station{queue.length>0&&<span style={{background:T.red,color:"#fff",borderRadius:10,padding:"2px 10px",fontSize:11,fontWeight:900}}>{queue.length} in queue</span>}</div>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid "+T.border,background:T.bgCard}}>
        {[["orders","Orders"+(queue.length>0?" ("+queue.length+")":"")],["avail","Availability"]].map(([k,l])=><button key={k} style={{flex:1,background:ktab===k?T.purple+"18":"transparent",color:ktab===k?T.purple:T.muted,border:"none",borderBottom:"2px solid "+(ktab===k?T.purple:"transparent"),padding:"10px 6px",cursor:"pointer",fontWeight:ktab===k?700:400,fontSize:11}} onClick={()=>setKtab(k)}>{l}</button>)}
      </div>
      <div style={{padding:14}}>
        <NotifList notifs={notifs} clear={clearNotif}/>
        {ktab==="orders"&&(
          <div>
            <div style={S.g3}>{[[T.amber,queue.length,"Queue"],[T.green,ready.length,"Ready"],[T.teal,orders.filter(o=>o.status==="Paid").length,"Done"]].map(([c,v,l])=><div key={l} style={{...S.card,textAlign:"center",borderColor:c+"33",padding:"10px 4px"}}><div style={{fontSize:22,fontWeight:900,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:9,color:T.muted,marginTop:3,textTransform:"uppercase",letterSpacing:1}}>{l}</div></div>)}</div>
            {queue.length===0&&ready.length===0&&<div style={{...S.card,textAlign:"center",padding:28}}><div style={{fontSize:36,marginBottom:6}}>🎉</div><div style={{color:T.muted}}>Kitchen is clear!</div></div>}
            {queue.map(o=>{
              const BTNS={Created:[T.teal,"Accept","Accepted"],Accepted:[T.purple,"Start Preparing","Preparing"],Preparing:[T.green,"Mark Ready","Ready"]};
              const [bc,bt,ns]=BTNS[o.status]||[];
              return(
                <div key={o.id} className="hov-card" style={{...S.card,borderLeft:"4px solid "+(SC[o.status]||T.border)}}>
                  <div style={{background:T.purple+"15",border:"1px solid "+T.purple+"33",borderRadius:8,padding:"8px 10px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><div style={{fontSize:12,fontWeight:900,color:T.purple}}>{o.kot_number}</div><div style={{fontSize:10,color:T.muted,marginTop:2}}>Table {o.table_no} - {o.created_by_name||"Waiter"}</div></div>
                      <span style={S.bdg(SC[o.status]||T.muted)}>{o.status}</span>
                    </div>
                  </div>
                  {o.special_instruction&&<div style={{background:T.amber+"15",border:"1px solid "+T.amber+"44",borderRadius:8,padding:"6px 10px",marginBottom:10}}><div style={{fontSize:9,color:T.amber,fontWeight:700,marginBottom:2}}>ORDER NOTE</div><div style={{fontSize:12,color:T.amber}}>{o.special_instruction}</div></div>}
                  <div style={{background:T.bgCard3,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
                    {(o.items||[]).map(i=><div key={i.id} style={{paddingBottom:6,marginBottom:6,borderBottom:"1px solid "+T.border}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontWeight:700,fontSize:14}}>{i.item_name}</span><span style={{color:T.teal,fontWeight:900,fontSize:18}}>x{i.qty}</span></div>{i.special_instruction&&<div style={{fontSize:10,color:T.amber,marginTop:2}}>{i.special_instruction}</div>}</div>)}
                  </div>
                  {bt&&<button className="hov-btn" style={{...S.btn(bc),marginTop:0,fontSize:13,padding:"11px"}} onClick={()=>updStatus(o.id,ns)}>{bt}</button>}
                </div>
              );
            })}
            {ready.length>0&&<div><div style={{fontSize:10,color:T.green,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Ready ({ready.length})</div>{ready.map(o=><div key={o.id} style={{...S.card,borderColor:T.green+"55",background:T.green+"08"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><span style={{fontWeight:900,color:T.green,fontSize:13}}>{o.kot_number}</span><span style={{color:T.muted,marginLeft:6,fontSize:11}}>Table {o.table_no}</span></div><span style={S.bdg(T.green)}>Ready</span></div><div style={{fontSize:11,color:T.muted,marginTop:4}}>{(o.items||[]).map(i=>i.item_name+"x"+i.qty).join(", ")}</div></div>)}</div>}
          </div>
        )}
        {ktab==="avail"&&(
          <div>
            <div style={{...S.card,borderColor:T.purple+"33",background:T.purple+"08",marginBottom:10}}><div style={{fontSize:12,fontWeight:700,color:T.purple,marginBottom:3}}>Item Availability</div><div style={{fontSize:10,color:T.muted}}>Toggle sold out - Waiter sees SOLD OUT tag instantly.</div></div>
            {soldOut.length>0&&<div style={{...S.card,borderColor:T.red+"44",background:T.red+"06",marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:T.red,marginBottom:6}}>Sold Out ({soldOut.length})</div>{menu.filter(m=>soldOut.includes(m.id)).map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid "+T.border}}><span style={{fontSize:12,fontWeight:600,color:T.red}}>{m.name}</span><button onClick={()=>toggleSO(m.id)} style={{background:T.green+"18",color:T.green,border:"1px solid "+T.green+"44",borderRadius:7,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:700}}>Restock</button></div>)}</div>}
            {menu.map(item=>{const isSO=soldOut.includes(item.id);return(
              <div key={item.id} style={{...S.card,borderColor:isSO?T.red+"44":T.border,background:isSO?T.red+"06":"transparent",padding:"11px 13px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:13,fontWeight:700,color:isSO?T.red:T.white}}>{item.name}{isSO&&<span style={{marginLeft:6,background:T.red+"22",color:T.red,border:"1px solid "+T.red+"44",borderRadius:6,padding:"1px 6px",fontSize:9,fontWeight:700}}>SOLD OUT</span>}</div><div style={{fontSize:10,color:T.muted,marginTop:2}}>{item.category} - ₹{item.price}</div></div>
                  <button onClick={()=>toggleSO(item.id)} style={{background:isSO?T.green:T.red+"18",color:isSO?"#fff":T.red,border:"1px solid "+(isSO?T.green:T.red),borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:700,minWidth:80}}>{isSO?"Restock":"Sold Out"}</button>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

// ADMIN VIEW
function AdminView({orders,setOrders,menu,setMenu,token,socket,notifs,clearNotif}){
  const [tab,setTab]=useState("dash");
  const [sideOpen,setSideOpen]=useState(true);
  const [selPay,setSP]=useState({});
  const [chartMode,setChartMode]=useState("count");
  const todayStr=new Date().toISOString().split("T")[0];
  const [from,setFrom]=useState(todayStr);
  const [to,setTo]=useState(todayStr);
  const [ar,setAr]=useState("today");
  const [cfg,setCfg]=useState({gst_percent:5,sc_enabled:false,sc_percent:10,round_off:true,restaurant_name:"My Restaurant",gst_number:"",footer:"Thank you for dining with us!"});
  const [saved,setSaved]=useState(false);
  const [toast,setToast]=useState(null);
  const [shiftOn,setShiftOn]=useState(false);
  const [shiftStart,setShiftStart]=useState(null);
  const [shifts,setShifts]=useState([]);
  const [cname,setCname]=useState({});
  const [cmob,setCmob]=useState({});
  const [dtype,setDtype]=useState({});
  const [dval,setDval]=useState({});
  const [mName,setMName]=useState(""); const [mPrice,setMPrice]=useState(""); const [mCat,setMCat]=useState("Veg");
  const [customers,setCustomers]=useState([]);
  const [custSearch,setCustSearch]=useState("");
  const [custResult,setCustResult]=useState(null);

  useEffect(()=>{
    apiFetch("/customers",undefined,null,token).then(setCustomers).catch(()=>{});
    apiFetch("/settings",undefined,null,token).then(d=>{if(d.gst_percent) setCfg(c=>({...c,...d,sc_enabled:!!d.service_charge_enabled,round_off:!!d.round_off_enabled}));}).catch(()=>{});
  },[]);

  const showToast=(msg,color)=>{setToast({msg,color});setTimeout(()=>setToast(null),2500);};
  const doSave=async()=>{
    try{
      await apiFetch("/settings","PATCH",{restaurant_name:cfg.restaurant_name,gst_number:cfg.gst_number,gst_percent:cfg.gst_percent,service_charge_enabled:cfg.sc_enabled,service_charge_percent:cfg.sc_percent,round_off_enabled:cfg.round_off,receipt_footer:cfg.footer},token);
      setSaved(true);showToast("Settings saved!",T.green);setTimeout(()=>setSaved(false),2500);
    }catch(e){showToast(e.message,T.red);}
  };
  const qr=(key)=>{
    const n=new Date(),fmt=d=>d.toISOString().split("T")[0];setAr(key);
    if(key==="today"){setFrom(fmt(n));setTo(fmt(n));}
    else if(key==="yesterday"){const y=new Date(n);y.setDate(y.getDate()-1);setFrom(fmt(y));setTo(fmt(y));}
    else if(key==="7days"){const f=new Date(n);f.setDate(f.getDate()-6);setFrom(fmt(f));setTo(fmt(n));}
    else if(key==="month"){setFrom(fmt(new Date(n.getFullYear(),n.getMonth(),1)));setTo(fmt(n));}
  };

  const f0=new Date(from);f0.setHours(0,0,0,0);
  const t0=new Date(to);t0.setHours(23,59,59,999);
  const cap=new Date();cap.setHours(23,59,59,999);
  const filt=orders.filter(o=>{const d=new Date(o.created_at);return d>=f0&&d<=t0;});
  const paid=filt.filter(o=>o.paid);
  const rev=paid.reduce((s,o)=>s+Number(o.final_amount||o.total),0);
  const paidToday=orders.filter(o=>o.paid&&new Date(o.created_at).toDateString()===new Date().toDateString());
  const pendingOrders=filt.filter(o=>!o.paid&&o.status!=="Cancelled");
  const cancelledFilt=filt.filter(o=>o.status==="Cancelled");
  const billing=orders.filter(o=>o.status==="Bill Pending");

  const payBd={};paid.forEach(o=>{const m=o.pay_method||"Other";payBd[m]=(payBd[m]||0)+Number(o.final_amount||o.total);});
  const itemCount={},itemRevenue={};
  paid.forEach(o=>(o.items||[]).forEach(i=>{itemCount[i.item_name]=(itemCount[i.item_name]||0)+i.qty;itemRevenue[i.item_name]=(itemRevenue[i.item_name]||0)+(i.price*i.qty);}));
  const topByCount=Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const topByRev=Object.entries(itemRevenue).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const topItems=chartMode==="count"?topByCount:topByRev;
  const topMax=topItems.length>0?topItems[0][1]:1;

  const cd=[];const cur=new Date(f0);
  while(cur<=t0&&cur<=cap){
    const key=cur.toISOString().split("T")[0];
    const v=paid.filter(o=>new Date(o.created_at).toISOString().split("T")[0]===key).reduce((s,o)=>s+Number(o.final_amount||o.total),0);
    cd.push({v,l:from===to?"Today":cur.toLocaleDateString("en-IN",{day:"numeric",month:"short"})});
    cur.setDate(cur.getDate()+1);
  }

  const calcBill=(o,oid)=>{
    const sub=Number(o.total);const gst=sub*(cfg.gst_percent/100);const sc=cfg.sc_enabled?sub*(cfg.sc_percent/100):0;
    const dt=dtype[oid]||"fixed",dv=Number(dval[oid]||0);const disc=dt==="percent"?sub*(dv/100):dv;
    const before=sub+gst+sc-disc;const roff=cfg.round_off?Math.round(before)-before:0;
    return{sub,gst,sc,disc,roff,final:Math.max(0,before+roff)};
  };

  const collect=async(o)=>{
    const m=selPay[o.id]||"Cash";const cn=cname[o.id]||"";const cm=cmob[o.id]||"";
    if(!cn.trim()||!cm.trim()){showToast("Customer name and mobile are required!",T.red);return;}
    if(cm.trim().length<10){showToast("Enter valid 10-digit mobile!",T.red);return;}
    const bill=calcBill(o,o.id);
    try{
      await apiFetch(`/orders/${o.id}/pay`,"PATCH",{pay_method:m,gst_percent:cfg.gst_percent,service_charge_percent:cfg.sc_enabled?cfg.sc_percent:0,discount_type:dtype[o.id]||"fixed",discount_value:Number(dval[o.id]||0),customer_name:cn.trim(),customer_mobile:cm.trim()},token);
      setOrders(p=>p.map(x=>x.id===o.id?{...x,status:"Paid",paid:true,pay_method:m,final_amount:bill.final,customer_name:cn.trim(),customer_mobile:cm.trim()}:x));
      if(socket.current) socket.current.emit("payment_done",{orderId:o.id,table:o.table_no,method:m});
      apiFetch("/customers",undefined,null,token).then(setCustomers).catch(()=>{});
      showToast("Collected ₹"+bill.final.toFixed(2)+" via "+m,T.green);
    }catch(e){showToast(e.message,T.red);}
  };

  const addMenuItem=async()=>{
    if(!mName||!mPrice) return;
    try{const item=await apiFetch("/menu","POST",{name:mName,price:Number(mPrice),category:mCat},token);setMenu(p=>[...p,item]);setMName("");setMPrice("");showToast("Item added",T.green);}
    catch(e){showToast(e.message,T.red);}
  };
  const removeMenuItem=async(id)=>{
    try{await apiFetch(`/menu/${id}`,"DELETE",null,token);setMenu(p=>p.filter(x=>x.id!==id));}
    catch(e){showToast(e.message,T.red);}
  };

  const closeShift=()=>{
    const so=orders.filter(o=>new Date(o.created_at)>=shiftStart);
    const ps=so.filter(o=>o.paid);const r=ps.reduce((s,o)=>s+Number(o.final_amount||o.total),0);
    setShifts(p=>[{id:Date.now(),start:shiftStart.toLocaleString("en-IN"),end:new Date().toLocaleString("en-IN"),totalOrders:so.length,totalRevenue:r,
      cash:ps.filter(o=>o.pay_method==="Cash").reduce((s,o)=>s+Number(o.final_amount||o.total),0),
      upi:ps.filter(o=>["GPay","PhonePe","UPI"].includes(o.pay_method)).reduce((s,o)=>s+Number(o.final_amount||o.total),0),
      card:ps.filter(o=>o.pay_method==="Card").reduce((s,o)=>s+Number(o.final_amount||o.total),0),
      pending:orders.filter(o=>o.status==="Bill Pending").length,cancelled:so.filter(o=>o.status==="Cancelled").length},...p]);
    setShiftOn(false);setShiftStart(null);showToast("Shift closed! Revenue ₹"+r.toLocaleString("en-IN"),T.green);
  };

  const searchCustomer=()=>{
    if(!custSearch.trim()){showToast("Enter name or mobile",T.amber);return;}
    const s=custSearch.trim().toLowerCase();
    const found=customers.find(c=>c.mobile.includes(custSearch.trim())||c.name.toLowerCase().includes(s));
    setCustResult(found||"notfound");
  };

  const groupByDay=(ords)=>{
    const g={};(ords||[]).forEach(o=>{const day=new Date(o.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});if(!g[day])g[day]=[];g[day].push(o);});
    return Object.entries(g).sort((a,b)=>new Date(b[0])-new Date(a[0]));
  };

  const SIDENAV=[
    {k:"dash",label:"Dashboard"},
    {k:"bill",label:"Billing"+(billing.length>0?" ("+billing.length+")":"")},
    {k:"customers",label:"Customers"},
    {k:"menu",label:"Menu"},
    {k:"shift",label:"Shift Report"},
    {k:"settings",label:"Settings"},
    {k:"orders",label:"All Orders"},
  ];

  return(
    <div style={{...S.app,display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(135deg,#1a1205,#241804)",borderBottom:"1px solid "+T.amber+"33",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setSideOpen(s=>!s)} style={{background:"transparent",border:"none",color:T.amber,fontSize:18,cursor:"pointer",padding:"2px 6px"}}>|||</button>
          <div>
            <div style={{fontSize:10,color:T.amber,fontWeight:800,textTransform:"uppercase",letterSpacing:2}}>ADMIN</div>
            <div style={{fontSize:16,fontWeight:900,color:T.white}}>{SIDENAV.find(m=>m.k===tab)?.label||"Dashboard"}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {billing.length>0&&<span style={{background:T.red,color:"#fff",borderRadius:10,padding:"3px 10px",fontSize:11,fontWeight:900}}>{billing.length} bill!</span>}
          <div style={{fontSize:11,color:T.amber,fontWeight:700}}>₹{rev.toLocaleString("en-IN")}</div>
        </div>
      </div>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {sideOpen&&(
          <div style={{width:150,background:T.bgCard,borderRight:"1px solid "+T.border,display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"}}>
            <div style={{padding:"12px 10px 6px",fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:2,fontWeight:700}}>Menu</div>
            {SIDENAV.map(m=>(
              <button key={m.k} className="hov-side" onClick={()=>setTab(m.k)}
                style={{display:"flex",alignItems:"center",gap:8,padding:"11px 14px",background:tab===m.k?T.amber+"18":"transparent",color:tab===m.k?T.amber:T.muted,border:"none",borderRight:tab===m.k?"3px solid "+T.amber:"3px solid transparent",cursor:"pointer",fontSize:12,fontWeight:tab===m.k?700:400,textAlign:"left",transition:"all 0.15s"}}>
                {m.label}
              </button>
            ))}
          </div>
        )}
        <div style={{flex:1,overflowY:"auto",padding:14}}>
          {toast&&<Toast msg={toast.msg} color={toast.color}/>}
          <NotifList notifs={notifs} clear={clearNotif}/>

          {tab==="dash"&&(
            <div>
              <div style={{...S.card,borderColor:T.amber+"33",padding:"12px 13px",marginBottom:12}}>
                <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:9}}>Filter by Date</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:9}}>
                  {[["today","Today"],["yesterday","Yesterday"],["7days","7 Days"],["month","Month"]].map(([k,l])=>(
                    <button key={k} onClick={()=>qr(k)} style={{background:ar===k?T.amber:T.amber+"18",color:ar===k?"#000":T.amber,border:"1px solid "+T.amber+(ar===k?"":"55"),borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>{l}</button>
                  ))}
                </div>
                <div style={S.g2}>
                  <div><div style={{...S.lbl,marginBottom:3}}>From</div><input style={S.inp} type="date" value={from} max={to} onChange={e=>{setFrom(e.target.value);setAr("custom");}}/></div>
                  <div><div style={{...S.lbl,marginBottom:3}}>To</div><input style={S.inp} type="date" value={to} min={from} onChange={e=>{if(e.target.value<from){showToast("End date must be after start!",T.amber);return;}setTo(e.target.value);setAr("custom");}}/></div>
                </div>
              </div>
              <div style={S.g2}>
                <StatCard label="Total Revenue" value={"₹"+rev.toLocaleString("en-IN")} color={T.amber} sub={paid.length+" orders paid"}/>
                <StatCard label="Total Orders" value={filt.filter(o=>o.status!=="Cancelled").length} color={T.teal} sub={pendingOrders.length+" pending"}/>
                <StatCard label="Customers" value={customers.length} color={T.purple} sub="All time"/>
                <StatCard label="Cancelled" value={cancelledFilt.length} color={T.red} sub={"₹"+cancelledFilt.reduce((s,o)=>s+Number(o.total),0).toLocaleString("en-IN")+" lost"}/>
              </div>
              <div style={{...S.card,borderColor:T.amber+"33",padding:"14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.white}}>Revenue Trend</div>
                  <div style={{fontSize:16,fontWeight:900,color:T.amber}}>₹{rev.toLocaleString("en-IN")}</div>
                </div>
                <BarChart data={cd} color={T.amber}/>
              </div>
              {Object.keys(payBd).length>0&&(
                <div style={S.card}>
                  <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:12}}>Payment Breakdown</div>
                  {Object.entries(payBd).map(([m,amt])=>{const pct=rev>0?Math.round((amt/rev)*100):0,c=PC[m]||T.muted;return(
                    <div key={m} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:c,fontWeight:700}}>{PI[m]} {m}</span><span style={{color:T.white,fontWeight:700}}>₹{Number(amt).toLocaleString("en-IN")} ({pct}%)</span></div>
                      <div style={{background:T.bgCard3,borderRadius:4,height:6}}><div style={{width:pct+"%",height:"100%",background:c,borderRadius:4}}/></div>
                    </div>
                  );})}
                </div>
              )}
              {topItems.length>0&&(
                <div style={S.card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div><div style={{fontSize:13,fontWeight:700,color:T.white}}>Top Selling Items</div><div style={{fontSize:10,color:T.muted,marginTop:2}}>by {chartMode==="count"?"number sold":"revenue"}</div></div>
                    <div style={{display:"flex",gap:4}}>
                      {[["count","# Count"],["revenue","₹ Revenue"]].map(([k,l])=><button key={k} onClick={()=>setChartMode(k)} style={{background:chartMode===k?T.amber:T.amber+"18",color:chartMode===k?"#000":T.amber,border:"1px solid "+T.amber+(chartMode===k?"":"55"),borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:10,fontWeight:700}}>{l}</button>)}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {topItems.map(([name,val],i)=>{const pct=Math.round((val/topMax)*100),c=COLORS[i]||T.teal;return(
                      <div key={name}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <div style={{display:"flex",alignItems:"center",gap:7}}>
                            <div style={{width:20,height:20,borderRadius:5,background:c+"22",border:"1px solid "+c+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:c,flexShrink:0}}>{i+1}</div>
                            <span style={{fontSize:12,fontWeight:600,color:T.white}}>{name}</span>
                          </div>
                          <span style={{fontSize:12,fontWeight:800,color:c}}>{chartMode==="count"?val+" sold":"₹"+Number(val).toLocaleString("en-IN")}</span>
                        </div>
                        <div style={{background:T.bgCard3,borderRadius:6,height:8,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:c,borderRadius:6}}/></div>
                      </div>
                    );})}
                  </div>
                </div>
              )}
              <div style={S.card}>
                <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:12}}>Order Statistics</div>
                <div style={S.g3}>
                  {[[T.green,paid.length,"Paid"],[T.red,cancelledFilt.length,"Cancelled"],[T.amber,pendingOrders.length,"Pending"]].map(([c,v,l])=>(
                    <div key={l} style={{background:c+"10",border:"1px solid "+c+"33",borderRadius:10,padding:"12px 8px",textAlign:"center"}}>
                      <div style={{fontSize:22,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
                      <div style={{fontSize:9,color:T.muted,marginTop:4,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {cancelledFilt.length>0&&(
                <div style={{...S.card,borderColor:T.red+"55",background:T.red+"08"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.red}}>Cancelled Orders ({cancelledFilt.length})</div>
                    <span style={{fontSize:11,color:T.red,fontWeight:700}}>Lost: ₹{cancelledFilt.reduce((s,o)=>s+Number(o.total),0).toLocaleString("en-IN")}</span>
                  </div>
                  {cancelledFilt.map(o=>(
                    <div key={o.id} style={{borderBottom:"1px solid "+T.border+"55",paddingBottom:8,marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><div><span style={{fontWeight:700,color:T.red,fontSize:12}}>#{o.id}</span><span style={{color:T.muted,marginLeft:6,fontSize:11}}>Table {o.table_no}</span></div><span style={{fontSize:12,color:T.mutedLt}}>₹{Number(o.total).toLocaleString("en-IN")}</span></div>
                      <div style={{fontSize:11,color:T.muted,marginBottom:o.cancel_reason?3:0}}>{(o.items&&o.items.length>0)?o.items.map(i=>i.item_name+"x"+i.qty).join(", "):"All items removed"}</div>
                      {o.cancel_reason&&<span style={{background:T.red+"18",borderRadius:6,padding:"3px 8px",fontSize:10,color:T.red,display:"inline-block"}}>Reason: {o.cancel_reason}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab==="bill"&&(
            <div>
              {billing.length===0&&<div style={{...S.card,textAlign:"center",padding:28}}><div style={{fontSize:36,marginBottom:6}}>🎉</div><div style={{color:T.muted}}>No bills pending!</div></div>}
              {billing.map(o=>{const bill=calcBill(o,o.id);const cn=cname[o.id]||"";const cm=cmob[o.id]||"";const missing=!cn.trim()||cm.trim().length<10;return(
                <div key={o.id} className="hov-card" style={{...S.card,border:"1px solid "+T.red+"44",background:T.red+"06"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div><span style={{fontWeight:900,color:T.teal,fontSize:15}}>#{o.id}</span><span style={{color:T.muted,marginLeft:6,fontSize:11}}>Table {o.table_no}</span>{o.kot_number&&<span style={{color:T.purple,marginLeft:6,fontSize:9}}>{o.kot_number}</span>}</div><span style={S.bdg(T.red)}>Bill Pending</span></div>
                  {(o.items||[]).map(i=><div key={i.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"2px 0",color:T.mutedLt}}><span>{i.item_name} x{i.qty}</span><span>₹{i.price*i.qty}</span></div>)}
                  <div style={S.div}/>
                  <div style={{...S.card,borderColor:missing?T.red+"66":T.green+"44",background:missing?T.red+"08":T.green+"08",padding:"10px 12px",marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:700,color:missing?T.red:T.green,marginBottom:8}}>Customer Details {missing?"(Required *)":"OK"}</div>
                    <div style={S.g2}>
                      <div><div style={S.lbl}>Full Name *</div><input style={cn.trim()?S.inp:S.inpR} placeholder="e.g. Aravinth" value={cn} onChange={e=>setCname(n=>({...n,[o.id]:e.target.value}))}/></div>
                      <div><div style={S.lbl}>Mobile * (10 digits)</div><input style={cm.trim().length>=10?S.inp:S.inpR} placeholder="9876543210" type="tel" maxLength={10} value={cm}
                        onChange={e=>{
                          let val="";
                          for(let i=0;i<e.target.value.length;i++){const ch=e.target.value[i];if(ch>="0"&&ch<="9")val+=ch;}
                          val=val.slice(0,10);
                          setCmob(n=>({...n,[o.id]:val}));
                          if(val.length===10){const found=customers.find(c=>c.mobile===val);if(found){setCname(n=>({...n,[o.id]:found.name}));showToast("Returning: "+found.name+" ("+found.total_visits+" visits)",T.green);}}
                        }}/></div>
                    </div>
                    {cm.trim().length===10&&customers.find(c=>c.mobile===cm.trim())&&<div style={{marginTop:8,fontSize:11,color:T.green}}>Returning - {customers.find(c=>c.mobile===cm.trim()).total_visits} visits - ₹{Number(customers.find(c=>c.mobile===cm.trim()).total_spent).toLocaleString("en-IN")} total spent</div>}
                  </div>
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:10,color:T.amber,fontWeight:700,marginBottom:5}}>Discount (Optional)</div>
                    <div style={S.g2}>
                      <select style={{...S.sel,fontSize:11,padding:"6px 9px"}} value={dtype[o.id]||"fixed"} onChange={e=>setDtype(d=>({...d,[o.id]:e.target.value}))}><option value="fixed">Fixed (₹)</option><option value="percent">Percent (%)</option></select>
                      <input style={{...S.inp,fontSize:11,padding:"6px 9px"}} placeholder="0" type="number" min="0" value={dval[o.id]||""} onChange={e=>setDval(d=>({...d,[o.id]:e.target.value}))}/>
                    </div>
                  </div>
                  <div style={{background:T.bgCard3,borderRadius:10,padding:"11px 12px",marginBottom:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:7}}>Bill Breakdown</div>
                    {[["Subtotal","₹"+bill.sub.toFixed(2),T.white],["GST "+cfg.gst_percent+"%","+₹"+bill.gst.toFixed(2),T.teal],cfg.sc_enabled?["Service "+cfg.sc_percent+"%","+₹"+bill.sc.toFixed(2),T.teal]:null,bill.disc>0?["Discount","-₹"+bill.disc.toFixed(2),T.green]:null,cfg.round_off&&bill.roff!==0?["Round Off",(bill.roff>0?"+":"")+"₹"+bill.roff.toFixed(2),T.muted]:null].filter(Boolean).map(([l,v,c])=><div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"2px 0",borderBottom:"1px solid "+T.border}}><span style={{color:T.muted}}>{l}</span><span style={{color:c,fontWeight:600}}>{v}</span></div>)}
                    <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:17,marginTop:7,color:T.white}}><span>Final</span><span style={{color:T.teal}}>₹{bill.final.toFixed(2)}</span></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:10}}>
                    {PMETHODS.map(m=>{const sel=(selPay[o.id]||"Cash")===m,c=PC[m]||T.teal;return(
                      <button key={m} className="hov-pay" onClick={()=>setSP(s=>({...s,[o.id]:m}))} style={{background:sel?c:c+"18",color:sel?"#fff":c,border:"1px solid "+c+(sel?"":"55"),borderRadius:8,padding:"9px 4px",cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                        <span style={{fontSize:16}}>{PI[m]}</span><span>{m}</span>
                      </button>
                    );})}
                  </div>
                  {missing&&<div style={{background:T.red+"18",border:"1px solid "+T.red+"44",borderRadius:8,padding:"8px 12px",marginBottom:8,fontSize:12,color:T.red,textAlign:"center"}}>Enter customer name and mobile to collect payment</div>}
                  <button className="hov-btn" style={{...S.btn(missing?T.muted:T.green),marginTop:0,fontSize:13,padding:"12px",cursor:missing?"not-allowed":"pointer",opacity:missing?0.6:1}} onClick={()=>collect(o)} disabled={missing}>Collect ₹{bill.final.toFixed(2)} via {selPay[o.id]||"Cash"}</button>
                </div>
              );})}
              {paidToday.length>0&&<div style={S.card}><div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:10}}>Paid Today ({paidToday.length})</div>{[...paidToday].reverse().map(o=><div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+T.border}}><div><span style={{color:T.teal,fontWeight:700}}>#{o.id}</span><span style={{color:T.muted,marginLeft:6,fontSize:11}}>Table {o.table_no}</span>{o.customer_name&&<span style={{color:T.green,marginLeft:6,fontSize:10}}>{o.customer_name}</span>}</div><div style={{textAlign:"right"}}><div style={{fontWeight:900,color:T.green,fontSize:13}}>₹{Number(o.final_amount||o.total).toLocaleString("en-IN")}</div><div style={{fontSize:10,color:PC[o.pay_method]||T.muted,fontWeight:700,display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end"}}><span>{PI[o.pay_method]||""}</span><span>{o.pay_method}</span></div></div></div>)}</div>}
            </div>
          )}

          {tab==="customers"&&(
            <div>
              <div style={S.chi}>
                <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:10}}>Search Customer</div>
                <div style={{display:"flex",gap:8}}><input style={{...S.inp,flex:1}} placeholder="Name or mobile number" value={custSearch} onChange={e=>setCustSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchCustomer()}/><button className="hov-btn" style={{...S.btn(T.teal),marginTop:0,width:"auto",padding:"9px 16px"}} onClick={searchCustomer}>Search</button></div>
              </div>
              {custResult==="notfound"&&<div style={{...S.card,textAlign:"center",padding:24,color:T.muted}}>No customer found for "{custSearch}"</div>}
              {custResult&&custResult!=="notfound"&&(
                <div>
                  <div style={{...S.card,borderColor:T.green+"44",background:T.green+"08"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}><div><div style={{fontSize:18,fontWeight:900,color:T.white}}>{custResult.name}</div><div style={{fontSize:13,color:T.teal,marginTop:2}}>Mobile: {custResult.mobile}</div></div><button onClick={()=>{setCustResult(null);setCustSearch("");}} style={{...S.bsm(T.border,true),marginTop:0,fontSize:11}}>Clear</button></div>
                    <div style={S.g3}>{[[T.teal,custResult.total_visits,"Visits"],[T.amber,"₹"+Number(custResult.total_spent).toLocaleString("en-IN"),"Total Spent"],[T.purple,new Date(custResult.last_visit).toLocaleDateString("en-IN",{day:"numeric",month:"short"}),"Last Visit"]].map(([c,v,l])=><div key={l} style={{background:c+"10",border:"1px solid "+c+"33",borderRadius:10,padding:"10px 8px",textAlign:"center"}}><div style={{fontSize:14,fontWeight:900,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:9,color:T.muted,marginTop:3,textTransform:"uppercase",letterSpacing:1}}>{l}</div></div>)}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:10}}>Order History (Day-wise)</div>
                  {groupByDay(custResult.orders||[]).map(([day,dayOrders])=>(
                    <div key={day} style={S.card}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:12,fontWeight:700,color:T.amber}}>{day}</div><div style={{fontSize:11,color:T.muted}}>{dayOrders.length} order(s) - ₹{dayOrders.reduce((s,o)=>s+Number(o.total||0),0).toLocaleString("en-IN")}</div></div>
                      {dayOrders.map((o,i)=><div key={i} style={{background:T.bgCard3,borderRadius:8,padding:"10px 12px",marginBottom:i<dayOrders.length-1?8:0}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div><span style={{fontWeight:700,color:T.teal,fontSize:12}}>{o.kot||("#"+o.order_id)}</span><span style={{color:T.muted,marginLeft:6,fontSize:11}}>Table {o.table}</span></div><div style={{textAlign:"right"}}><div style={{fontWeight:900,color:T.green,fontSize:13}}>₹{Number(o.total).toLocaleString("en-IN")}</div><div style={{fontSize:10,color:PC[o.pay_method]||T.muted,display:"flex",alignItems:"center",gap:2,justifyContent:"flex-end"}}><span>{PI[o.pay_method]||""}</span><span>{o.pay_method}</span></div></div></div><div style={{fontSize:11,color:T.muted}}>{(o.items||[]).map(i=>i.item_name+"x"+i.qty).join(", ")}</div></div>)}
                    </div>
                  ))}
                </div>
              )}
              {!custResult&&(
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:10}}>All Customers ({customers.length})</div>
                  {customers.length===0&&<div style={{...S.card,textAlign:"center",padding:28,color:T.muted}}>No customers yet. Collect payment to add customers.</div>}
                  {[...customers].sort((a,b)=>Number(b.total_spent)-Number(a.total_spent)).map(c=><div key={c.id} className="hov-card" style={{...S.card,cursor:"pointer"}} onClick={()=>setCustResult({...c,orders:[]})}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:14,fontWeight:700,color:T.white}}>{c.name}</div><div style={{fontSize:11,color:T.teal,marginTop:2}}>{c.mobile}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:900,color:T.amber}}>₹{Number(c.total_spent).toLocaleString("en-IN")}</div><div style={{fontSize:10,color:T.muted,marginTop:2}}>{c.total_visits} visit(s)</div></div></div></div>)}
                </div>
              )}
            </div>
          )}

          {tab==="menu"&&(
            <div>
              <div style={S.chi}><div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:10}}>Add Item</div><input style={{...S.inp,marginBottom:8}} placeholder="Item name" value={mName} onChange={e=>setMName(e.target.value)}/><div style={{...S.g2,marginBottom:8}}><input style={S.inp} placeholder="Price" type="number" value={mPrice} onChange={e=>setMPrice(e.target.value)}/><select style={S.sel} value={mCat} onChange={e=>setMCat(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div><button className="hov-btn" style={{...S.btn(),marginTop:0}} onClick={addMenuItem}>Add to Menu</button></div>
              {CATEGORIES.map(c=>{const items=menu.filter(m=>m.category===c);if(!items.length)return null;return(<div key={c} style={S.card}><div style={{fontSize:10,fontWeight:700,color:T.teal,marginBottom:9,textTransform:"uppercase",letterSpacing:1}}>{c} ({items.length})</div>{items.map(m=><div key={m.id} style={S.row}><div style={{fontSize:13,fontWeight:600}}>{m.name}</div><div style={{display:"flex",alignItems:"center",gap:9}}><span style={{color:T.teal,fontWeight:800}}>₹{m.price}</span><button style={{...S.bsm(T.red,true),marginTop:0,padding:"2px 9px",fontSize:10}} onClick={()=>removeMenuItem(m.id)}>Remove</button></div></div>)}</div>);})}
            </div>
          )}

          {tab==="shift"&&(
            <div>
              <div style={{...S.card,borderColor:T.cyan+"44",background:T.cyan+"08"}}><div style={{fontSize:13,fontWeight:700,color:T.cyan,marginBottom:8}}>Shift Management</div>{!shiftOn?<button className="hov-btn" style={{...S.btn(T.cyan),marginTop:0}} onClick={()=>{setShiftOn(true);setShiftStart(new Date());}}>Start Shift</button>:<div><div style={{fontSize:11,color:T.muted,marginBottom:10}}>Started: <b style={{color:T.cyan}}>{shiftStart&&shiftStart.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</b></div><button className="hov-btn" style={{...S.btn(T.red),marginTop:0}} onClick={closeShift}>Close Shift</button></div>}</div>
              {shifts.length===0&&!shiftOn&&<div style={{color:T.muted,textAlign:"center",padding:24,fontSize:13}}>No shifts yet.</div>}
              {shifts.map(s=><div key={s.id} style={S.card}><div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:8}}>{s.start} to {s.end}</div>{[["Total Orders",s.totalOrders],["Total Revenue","₹"+Number(s.totalRevenue).toLocaleString("en-IN")],["Cash","₹"+Number(s.cash).toLocaleString("en-IN")],["UPI","₹"+Number(s.upi).toLocaleString("en-IN")],["Card","₹"+Number(s.card).toLocaleString("en-IN")],["Pending at Close",s.pending],["Cancelled",s.cancelled]].map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderBottom:"1px solid "+T.border}}><span style={{color:T.muted}}>{l}</span><span style={{color:T.white,fontWeight:700}}>{v}</span></div>)}</div>)}
            </div>
          )}

          {tab==="settings"&&(
            <div style={S.chi}>
              <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:12}}>Restaurant Settings</div>
              {[["Restaurant Name","restaurant_name","My Restaurant"],["GST Number","gst_number","27AAPFU0939F1ZV"],["Receipt Footer","footer","Thank you!"]].map(([l,k,ph])=><div key={k} style={{marginBottom:10}}><div style={S.lbl}>{l}</div><input style={S.inp} placeholder={ph} value={cfg[k]||""} onChange={e=>setCfg(s=>({...s,[k]:e.target.value}))}/></div>)}
              <div style={{marginBottom:10}}><div style={S.lbl}>GST %</div><select style={S.sel} value={cfg.gst_percent} onChange={e=>setCfg(s=>({...s,gst_percent:Number(e.target.value)}))}>{[0,5,12,18].map(v=><option key={v} value={v}>{v}%</option>)}</select></div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:12,color:T.white}}>Service Charge</span><button onClick={()=>setCfg(s=>({...s,sc_enabled:!s.sc_enabled}))} style={{background:cfg.sc_enabled?T.green:T.border,color:"#fff",border:"none",borderRadius:20,padding:"4px 14px",cursor:"pointer",fontSize:11,fontWeight:700}}>{cfg.sc_enabled?"ON":"OFF"}</button></div>
              {cfg.sc_enabled&&<div style={{marginBottom:10}}><div style={S.lbl}>Service Charge %</div><input style={S.inp} type="number" value={cfg.sc_percent} onChange={e=>setCfg(s=>({...s,sc_percent:Number(e.target.value)}))}/></div>}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><span style={{fontSize:12,color:T.white}}>Round Off</span><button onClick={()=>setCfg(s=>({...s,round_off:!s.round_off}))} style={{background:cfg.round_off?T.green:T.border,color:"#fff",border:"none",borderRadius:20,padding:"4px 14px",cursor:"pointer",fontSize:11,fontWeight:700}}>{cfg.round_off?"ON":"OFF"}</button></div>
              <button className="hov-btn" style={{...S.btn(saved?T.green:T.teal),marginTop:0}} onClick={doSave}>{saved?"Settings Saved!":"Save Settings"}</button>
            </div>
          )}

          {tab==="orders"&&(
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:10}}>All Orders ({orders.length})</div>
              {orders.length===0&&<div style={{color:T.muted,textAlign:"center",padding:24}}>No orders yet</div>}
              {[...orders].reverse().map(o=><div key={o.id} className="hov-card" style={{...S.card,borderLeft:"3px solid "+(SC[o.status]||T.border)}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><div><span style={{fontWeight:900,color:T.teal,fontSize:12}}>#{o.id}</span><span style={{color:T.muted,fontSize:11,marginLeft:6}}>Table {o.table_no}</span>{o.kot_number&&<span style={{color:T.purple,marginLeft:6,fontSize:9,fontWeight:700}}>{o.kot_number}</span>}</div><span style={S.bdg(SC[o.status]||T.muted)}>{o.status}</span></div><div style={{fontSize:11,color:T.muted,marginBottom:5}}>{(o.items||[]).map(i=>i.item_name+"x"+i.qty).join(", ")}</div><div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{fontWeight:900,color:T.white}}>₹{Number(o.final_amount||o.total).toLocaleString("en-IN")}</span>{o.pay_method&&<span style={{color:PC[o.pay_method]||T.muted,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><span>{PI[o.pay_method]||""}</span><span>{o.pay_method}</span></span>}</div>{o.customer_name&&<div style={{fontSize:10,color:T.green,marginTop:4}}>{o.customer_name} - {o.customer_mobile}</div>}{o.cancel_reason&&<div style={{fontSize:10,color:T.red,marginTop:4}}>Cancelled: {o.cancel_reason}</div>}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// MAIN APP
export default function App(){
  const savedToken=localStorage.getItem("hotel_token");
  const savedUser=localStorage.getItem("hotel_user");
  const [token,setToken]=useState(savedToken||null);
  const [user,setUser]=useState(savedUser?JSON.parse(savedUser):null);
  const [orders,setOrders]=useState([]);
  const [menu,setMenu]=useState([]);
  const [soldOut,setSoldOut]=useState(()=>{try{const s=localStorage.getItem("hotel_soldout");return s?JSON.parse(s):[];}catch{return[];}});
  const [loading,setLoading]=useState(false);
  const [notifs,setNotifs]=useState([]);

  const addNotif=useCallback((msg)=>setNotifs(n=>[...n,{id:Date.now()+Math.random(),msg}]),[]);
  const clearNotif=(id)=>setNotifs(n=>n.filter(x=>x.id!==id));

  const socketHandlers={
    order_received:(o)=>{setOrders(p=>p.find(x=>x.id===o.id)?p:[...p,o]);addNotif("New order #"+o.id+" - Table "+o.table_no);},
    order_update:(o)=>setOrders(p=>p.map(x=>x.id===o.id?{...x,...o}:x)),
    food_ready:({msg})=>addNotif(msg),
    bill_request:({msg})=>addNotif(msg),
    table_cleared:({msg})=>addNotif(msg),
    order_closed:(id)=>setOrders(p=>p.map(o=>o.id===id?{...o,status:"Paid"}:o)),
    sold_out_update:(ids)=>{setSoldOut(ids);try{localStorage.setItem("hotel_soldout",JSON.stringify(ids));}catch{}},
  };
  const socket=useSocket(user?.role,socketHandlers);

  useEffect(()=>{
    if(savedToken&&savedUser){
      setLoading(true);
      Promise.all([apiFetch("/orders","GET",null,savedToken),apiFetch("/menu","GET",null,savedToken)])
        .then(([o,m])=>{setOrders(o);setMenu(m);})
        .catch(()=>{localStorage.removeItem("hotel_token");localStorage.removeItem("hotel_user");setToken(null);setUser(null);})
        .finally(()=>setLoading(false));
    }
  },[]);

  const login=async(t,u)=>{
    localStorage.setItem("hotel_token",t);localStorage.setItem("hotel_user",JSON.stringify(u));
    setToken(t);setUser(u);setLoading(true);
    try{const [o,m]=await Promise.all([apiFetch("/orders","GET",null,t),apiFetch("/menu","GET",null,t)]);setOrders(o);setMenu(m);}
    catch(e){console.error(e);}finally{setLoading(false);}
  };
  const logout=()=>{localStorage.removeItem("hotel_token");localStorage.removeItem("hotel_user");setToken(null);setUser(null);setOrders([]);setMenu([]);setNotifs([]);};

  if(!user) return <LoginScreen onLogin={login}/>;
  if(loading) return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.bg,gap:16}}><div style={{fontSize:44}}>🏨</div><div style={{color:T.teal,fontSize:16,fontWeight:700}}>Loading...</div></div>;

  const sharedProps={orders,setOrders,menu,token,socket,notifs,clearNotif};
  return(
    <div>
      <div style={{position:"fixed",top:12,right:14,zIndex:999,display:"flex",alignItems:"center",gap:8}}>
        <div style={{background:T.tealGlow,border:"1px solid "+T.borderHi,borderRadius:20,padding:"4px 14px",fontSize:12,color:T.tealLight}}>{user.name}</div>
        <button style={{background:"transparent",color:T.red,border:"1px solid "+T.red+"55",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:700}} onClick={logout}>Logout</button>
      </div>
      {user.role==="waiter"&&<WaiterView {...sharedProps} setOrders={setOrders} soldOut={soldOut}/>}
      {user.role==="kitchen"&&<KitchenView {...sharedProps} setMenu={setMenu} soldOut={soldOut} setSoldOut={setSoldOut}/>}
      {user.role==="admin"&&<AdminView {...sharedProps} setMenu={setMenu}/>}
    </div>
  );
}
