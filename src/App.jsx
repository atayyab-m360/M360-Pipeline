 import { useState, useMemo, useEffect, useCallback } from "react";

const STATUS_CONFIG = {
  "To Outreach":          { color: "#6366f1", bg: "#eef2ff", emoji: "📋" },
  "Outreached":           { color: "#f59e0b", bg: "#fffbeb", emoji: "📤" },
  "Interested":           { color: "#10b981", bg: "#ecfdf5", emoji: "✅" },
  "Interview Scheduled":  { color: "#3b82f6", bg: "#eff6ff", emoji: "📅" },
  "Interviewed":          { color: "#8b5cf6", bg: "#f5f3ff", emoji: "🎙️" },
  "Demo Scheduled":       { color: "#f97316", bg: "#fff7ed", emoji: "🗓️" },
  "Demo Done":            { color: "#0ea5e9", bg: "#f0f9ff", emoji: "🖥️" },
  "Not Interested":       { color: "#ef4444", bg: "#fef2f2", emoji: "❌" },
  "Onboarded":            { color: "#14b8a6", bg: "#f0fdfa", emoji: "🎉" },
};
const STATUSES = Object.keys(STATUS_CONFIG);

const TEAM_MEMBERS = ["Unassigned", "Abdul", "Areeb", "Saba", "Omar"];

const STORAGE_KEY = "m360_clients_v1";

const SAMPLE_CLIENTS = [
  {
    id: 1,
    name: "Katherine Soltani",
    company: "DC Muslim Youth",
    contact: "katherine.soltani@gmail.com",
    status: "Demo Scheduled",
    source: "Pilot",
    assignedTo: "Abdul",
    notes: "DMV-based community organizer. MSA-to-professional pipeline focus. Excited about demo but currently happy with Luma for events. Cannot do group cohort demo — evenings only. Schedule individual demo separately.",
    lastUpdated: "2026-06-12",
  },
];

let _nextId = 100;
const uid = () => _nextId++;
const today = () => new Date().toISOString().slice(0, 10);

function loadClients() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return SAMPLE_CLIENTS;
}

function saveClients(clients) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clients)); } catch {}
}

function exportCSV(clients) {
  const cols = ["name","company","contact","source","status","assignedTo","notes","lastUpdated"];
  const header = cols.join(",");
  const rows = clients.map(c =>
    cols.map(k => `"${(c[k] || "").toString().replace(/"/g, '""')}"`).join(",")
  );
  const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "m360_clients.csv"; a.click();
  URL.revokeObjectURL(url);
}

const Badge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {};
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`,
      borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {cfg.emoji} {status}
    </span>
  );
};

const Toast = ({ msg, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"#111", color:"#fff", padding:"10px 20px", borderRadius:10, fontSize:14,
      fontWeight:600, zIndex:999, boxShadow:"0 4px 20px #0004", whiteSpace:"nowrap" }}>
      {msg}
    </div>
  );
};

const Modal = ({ client, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState(client || { name:"", company:"", contact:"", status:"To Outreach", notes:"", source:"", assignedTo:"Unassigned" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!client?.id;

  const fields = [
    { label:"Full Name",             key:"name",    placeholder:"e.g. Sarah Ahmed" },
    { label:"Company",               key:"company", placeholder:"e.g. TechCorp BD" },
    { label:"Contact (email/phone)", key:"contact", placeholder:"e.g. sarah@example.com" },
    { label:"Source",                key:"source",  placeholder:"e.g. LinkedIn, Referral, Event" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"#00000066", zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:16, padding:28, width:"100%", maxWidth:480,
        boxShadow:"0 20px 60px #0003", maxHeight:"90vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:"#111" }}>
            {isEdit ? "Edit Client" : "Add Client"}
          </h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#888" }}>✕</button>
        </div>
        {fields.map(({ label, key, placeholder }) => (
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:4 }}>{label}</label>
            <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
              style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb",
                fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>
        ))}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:4 }}>Status</label>
          <select value={form.status} onChange={e => set("status", e.target.value)}
            style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb",
              fontSize:14, outline:"none", background:"#fff" }}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:4 }}>Assigned To</label>
          <select value={form.assignedTo || "Unassigned"} onChange={e => set("assignedTo", e.target.value)}
            style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb",
              fontSize:14, outline:"none", background:"#fff" }}>
            {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:4 }}>Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Next steps, context, follow-up dates..." rows={3}
            style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb",
              fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }} />
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {isEdit && (
            <button onClick={() => onDelete(client.id)} style={{ padding:"10px 14px", borderRadius:8,
              border:"1.5px solid #fca5a5", background:"#fef2f2", cursor:"pointer", color:"#ef4444", fontWeight:600 }}>
              Delete
            </button>
          )}
          <button onClick={onClose} style={{ flex:1, padding:"10px 0", borderRadius:8,
            border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontWeight:600, color:"#555" }}>
            Cancel
          </button>
          <button onClick={() => onSave({ ...form, lastUpdated: today() })} style={{ flex:2, padding:"10px 0",
            borderRadius:8, border:"none", background:"#6366f1", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:14 }}>
            {isEdit ? "Save Changes" : "Add Client"}
          </button>
        </div>
      </div>
    </div>
  );
};

const DrivePanel = ({ clients, onImport, onClose }) => {
  const [status, setStatus] = useState("idle");
  const jsonStr = JSON.stringify(clients, null, 2);

  const copyJSON = () => {
    navigator.clipboard.writeText(jsonStr).catch(() => {});
    setStatus("copying");
    setTimeout(() => setStatus("done"), 1200);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed)) { onImport(parsed); onClose(); }
        else alert("Invalid file format.");
      } catch { alert("Could not parse file."); }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#00000066", zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:16, padding:28, width:"100%", maxWidth:500,
        boxShadow:"0 20px 60px #0003" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:"#111" }}>📁 Backup & Sync</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#888" }}>✕</button>
        </div>
        <p style={{ color:"#888", fontSize:13, marginTop:0, marginBottom:20 }}>
          Your data saves automatically in this browser. Use the options below to share with your team or back up to Google Drive.
        </p>
        <div style={{ background:"#f8f9fc", borderRadius:12, padding:16, marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>📤 Export to Google Drive</div>
          <ol style={{ margin:0, paddingLeft:20, color:"#555", fontSize:13, lineHeight:1.7 }}>
            <li>Click <strong>Copy JSON</strong> below</li>
            <li>Open <a href="https://drive.google.com" target="_blank" rel="noreferrer" style={{ color:"#6366f1" }}>Google Drive</a> → New → Google Docs</li>
            <li>Paste and save — share the doc with your team</li>
          </ol>
          <button onClick={copyJSON} style={{ marginTop:12, width:"100%", padding:"10px 0", borderRadius:8,
            border:"none", background: status === "done" ? "#10b981" : "#6366f1",
            color:"#fff", cursor:"pointer", fontWeight:700, fontSize:14, transition:"background .3s" }}>
            {status === "idle" ? "📋 Copy JSON" : status === "copying" ? "Copying…" : "✅ Copied!"}
          </button>
        </div>
        <div style={{ background:"#f8f9fc", borderRadius:12, padding:16, marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>⬇️ Download as CSV</div>
          <p style={{ color:"#555", fontSize:13, margin:"0 0 10px" }}>Opens in Excel or Google Sheets — great for the weekly review meeting.</p>
          <button onClick={() => { exportCSV(clients); onClose(); }} style={{ width:"100%", padding:"10px 0",
            borderRadius:8, border:"none", background:"#10b981", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:14 }}>
            ⬇️ Download CSV
          </button>
        </div>
        <div style={{ background:"#f8f9fc", borderRadius:12, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>📥 Import from backup</div>
          <p style={{ color:"#555", fontSize:13, margin:"0 0 10px" }}>Load a previously exported JSON file to restore or merge data.</p>
          <label style={{ display:"block", width:"100%", padding:"10px 0", borderRadius:8,
            border:"1.5px dashed #d1d5db", background:"#fff", cursor:"pointer", fontWeight:600,
            fontSize:14, color:"#6366f1", textAlign:"center", boxSizing:"border-box" }}>
            📂 Choose JSON file
            <input type="file" accept=".json" onChange={handleImport} style={{ display:"none" }} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [clients, setClientsRaw] = useState(() => loadClients());
  const [filter, setFilter]   = useState("All");
  const [search, setSearch]   = useState("");
  const [modal, setModal]     = useState(null);
  const [driveOpen, setDriveOpen] = useState(false);
  const [view, setView]       = useState("table");
  const [toast, setToast]     = useState(null);

  const setClients = useCallback((updater) => {
    setClientsRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveClients(next);
      return next;
    });
  }, []);

  const showToast = (msg) => setToast(msg);

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const matchStatus = filter === "All" || c.status === filter;
      const q = search.toLowerCase();
      return matchStatus && (!q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
    });
  }, [clients, filter, search]);

  const counts = useMemo(() => {
    const r = { All: clients.length };
    STATUSES.forEach(s => r[s] = clients.filter(c => c.status === s).length);
    return r;
  }, [clients]);

  const saveClient = (data) => {
    if (data.id) {
      setClients(cs => cs.map(c => c.id === data.id ? data : c));
      showToast("✅ Client updated");
    } else {
      setClients(cs => [...cs, { ...data, id: uid() }]);
      showToast("✅ Client added");
    }
    setModal(null);
  };

  const deleteClient = (id) => {
    setClients(cs => cs.filter(c => c.id !== id));
    setModal(null);
    showToast("🗑️ Client removed");
  };

  const quickStatus = (id, status) => {
    setClients(cs => cs.map(c => c.id === id ? { ...c, status, lastUpdated: today() } : c));
    showToast(`↪️ Moved to ${status}`);
  };

  const importClients = (data) => {
    setClients(data);
    showToast(`📥 Imported ${data.length} clients`);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f8f9fc", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"16px 20px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:24 }}>🐯</span>
                <h1 style={{ margin:0, fontSize:20, fontWeight:800, color:"#111" }}>M360 Tiger Team</h1>
              </div>
              <p style={{ margin:0, color:"#888", fontSize:13, marginTop:2 }}>Outreach & Customer Success Pipeline · {clients.length} clients</p>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button onClick={() => setDriveOpen(true)} style={{ padding:"8px 14px", borderRadius:8,
                border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontWeight:600, fontSize:13, color:"#555" }}>
                📁 Backup / Sync
              </button>
              <button onClick={() => setView(v => v === "table" ? "board" : "table")} style={{ padding:"8px 14px",
                borderRadius:8, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontWeight:600, fontSize:13, color:"#555" }}>
                {view === "table" ? "📊 Board" : "📋 Table"}
              </button>
              <button onClick={() => setModal("add")} style={{ padding:"8px 16px", borderRadius:8,
                border:"none", background:"#6366f1", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13 }}>
                + Add Client
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 16px" }}>
        <div style={{ display:"flex", gap:10, overflowX:"auto", marginBottom:20, paddingBottom:4 }}>
          {STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = filter === s;
            return (
              <div key={s} onClick={() => setFilter(f => f === s ? "All" : s)} style={{
                background: active ? cfg.bg : "#fff",
                border: `1.5px solid ${active ? cfg.color : "#e5e7eb"}`,
                borderRadius:12, padding:"10px 14px", cursor:"pointer", minWidth:110, flexShrink:0,
                transition:"all .15s",
              }}>
                <div style={{ fontSize:18 }}>{cfg.emoji}</div>
                <div style={{ fontSize:20, fontWeight:800, color: cfg.color }}>{counts[s] || 0}</div>
                <div style={{ fontSize:11, color:"#888", fontWeight:500, marginTop:2 }}>{s}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or company…"
            style={{ flex:1, minWidth:200, padding:"9px 14px", borderRadius:8,
              border:"1.5px solid #e5e7eb", fontSize:14, outline:"none" }} />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb",
              fontSize:14, outline:"none", background:"#fff", color:"#333" }}>
            <option value="All">All ({counts.All})</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].emoji} {s} ({counts[s] || 0})</option>)}
          </select>
        </div>

        {view === "table" && (
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
            {filtered.length === 0 ? (
              <div style={{ padding:40, textAlign:"center", color:"#aaa" }}>
                <div style={{ fontSize:40, marginBottom:8 }}>📭</div>
                <div style={{ fontWeight:600 }}>No clients found</div>
                <div style={{ fontSize:13, marginTop:4 }}>Adjust the filter or add a new client</div>
              </div>
            ) : filtered.map((c, i) => (
              <div key={c.id} style={{
                padding:"14px 18px",
                borderBottom: i < filtered.length - 1 ? "1px solid #f0f0f0" : "none",
                display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap",
              }}>
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:"#111" }}>{c.name}</div>
                  <div style={{ color:"#888", fontSize:13 }}>{c.company}</div>
                  <div style={{ color:"#bbb", fontSize:12 }}>{c.contact}</div>
                </div>
                <div style={{ flex:1, minWidth:140 }}>
                  <Badge status={c.status} />
                  {c.notes && <div style={{ color:"#666", fontSize:12, marginTop:4, fontStyle:"italic" }}>{c.notes}</div>}
                  {c.source && <div style={{ color:"#bbb", fontSize:11, marginTop:2 }}>via {c.source}</div>}
                </div>
                <div style={{ minWidth:90, flexShrink:0 }}>
                  <div style={{ fontSize:11, color:"#aaa", fontWeight:500, marginBottom:3 }}>ASSIGNED TO</div>
                  <div style={{ fontSize:13, fontWeight:700, color: c.assignedTo && c.assignedTo !== "Unassigned" ? "#6366f1" : "#ccc" }}>
                    {c.assignedTo && c.assignedTo !== "Unassigned" ? "👤 " + c.assignedTo : "—"}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0, flexWrap:"wrap" }}>
                  <select value={c.status} onChange={e => quickStatus(c.id, e.target.value)}
                    style={{ padding:"5px 8px", borderRadius:6, border:"1px solid #e5e7eb",
                      fontSize:12, background:"#f9fafb", cursor:"pointer" }}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => setModal(c)} style={{ background:"#f3f4f6", border:"none",
                    borderRadius:6, padding:"5px 9px", cursor:"pointer", fontSize:14 }}>✏️</button>
                </div>
                <div style={{ color:"#ddd", fontSize:11, alignSelf:"center", flexShrink:0 }}>
                  {c.lastUpdated}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "board" && (
          <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:12 }}>
            {STATUSES.map(status => {
              const cfg = STATUS_CONFIG[status];
              const cols = clients.filter(c => c.status === status);
              return (
                <div key={status} style={{ minWidth:200, flex:"0 0 200px", background:cfg.bg,
                  borderRadius:12, padding:12, border:`1.5px solid ${cfg.color}30` }}>
                  <div style={{ fontWeight:700, fontSize:13, color:cfg.color, marginBottom:10 }}>
                    {cfg.emoji} {status} <span style={{ fontWeight:400, opacity:.7 }}>({cols.length})</span>
                  </div>
                  {cols.map(c => (
                    <div key={c.id} onClick={() => setModal(c)} style={{ background:"#fff", borderRadius:8,
                      padding:10, marginBottom:8, boxShadow:"0 1px 4px #0001", cursor:"pointer" }}>
                      <div style={{ fontWeight:600, fontSize:13, color:"#111" }}>{c.name}</div>
                      <div style={{ color:"#888", fontSize:12 }}>{c.company}</div>
                      {c.assignedTo && c.assignedTo !== "Unassigned" && (
                        <div style={{ fontSize:11, color:"#6366f1", fontWeight:600, marginTop:3 }}>👤 {c.assignedTo}</div>
                      )}
                      {c.notes && <div style={{ color:"#aaa", fontSize:11, marginTop:4, fontStyle:"italic" }}>{c.notes}</div>}
                    </div>
                  ))}
                  {cols.length === 0 && (
                    <div style={{ color:"#bbb", fontSize:12, textAlign:"center", padding:"12px 0" }}>Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop:20, background:"#fffbeb", border:"1.5px solid #fcd34d", borderRadius:12, padding:"12px 16px",
          display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>📅</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:"#92400e" }}>Weekly Review Tip</div>
            <div style={{ fontSize:12, color:"#b45309" }}>
              Use <strong>Backup / Sync → Download CSV</strong> before each weekly meeting to share a snapshot with the team. Filter by "To Outreach" to see who still needs contact.
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <Modal
          client={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={saveClient}
          onDelete={deleteClient}
        />
      )}
      {driveOpen && (
        <DrivePanel clients={clients} onImport={importClients} onClose={() => setDriveOpen(false)} />
      )}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
