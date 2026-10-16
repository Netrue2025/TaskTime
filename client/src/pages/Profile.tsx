import { BellRing, Download, LogOut, Moon, ShieldCheck } from "../icons";
import { api } from "../api";

function urlBase64ToUint8Array(base64: string) { const padding = "=".repeat((4 - base64.length % 4) % 4); const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...raw].map(c => c.charCodeAt(0))); }
export function Profile({ user, notificationEnabled, onLogout }: { user: any; notificationEnabled: boolean; onLogout: () => void }) {
  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return alert("Push notifications are not supported in this browser.");
    const permission = await Notification.requestPermission(); if (permission !== "granted") return;
    const { publicKey } = await api<{ publicKey: string | null }>("/push/public-key"); if (!publicKey) return alert("Push notifications have not been configured on the server yet.");
    const registration = await navigator.serviceWorker.ready; const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
    await api("/push/subscribe", { method: "POST", body: JSON.stringify(subscription) }); alert("Reminders are on.");
  }
  async function logout() { await api("/auth/logout", { method: "POST" }); onLogout(); }
  return <div className="page"><header className="page-header compact"><div><span className="eyebrow">YOUR SPACE</span><h1>Profile &<br /><em>preferences.</em></h1></div></header>
    <section className="profile-card"><div className="avatar">{user.name.split(/\s+/).map((x: string) => x[0]).slice(0, 2).join("")}</div><div><h2>{user.name}</h2><p>@{user.username}</p></div></section>
    <div className="settings-group"><span className="eyebrow">NOTIFICATIONS</span><button onClick={enablePush}><i><BellRing /></i><span><b>Task reminders</b><small>{notificationEnabled ? "Enabled on this account" : "Get a nudge when a task is due"}</small></span><em>{notificationEnabled ? "On" : "Set up"}</em></button><button disabled><i><Moon /></i><span><b>Quiet hours</b><small>Coming after the MVP</small></span><em>—</em></button></div>
    <div className="settings-group"><span className="eyebrow">APP</span><button onClick={() => alert("On iPhone, use Share → Add to Home Screen. On Android, use your browser’s Install app option.")}><i><Download /></i><span><b>Install TaskLite</b><small>Keep it close, like an app</small></span><em>How</em></button><button disabled><i><ShieldCheck /></i><span><b>Privacy</b><small>Shared cards never include task names</small></span></button></div>
    <button className="logout-btn" onClick={logout}><LogOut size={18} />Sign out</button><p className="version">TaskLite v1.0 · Built for lighter days</p>
  </div>;
}
