import { BellRing, Download, LogOut, Moon, ShieldCheck } from "../icons";
import { useState } from "react";
import { api } from "../api";

function urlBase64ToUint8Array(base64: string) { const padding = "=".repeat((4 - base64.length % 4) % 4); const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...raw].map(c => c.charCodeAt(0))); }
type PwaInstall = { canInstall: boolean; installed: boolean; isIos: boolean; requestInstall: () => Promise<"accepted" | "dismissed" | "unavailable"> };
export function Profile({ user, notificationEnabled, pwaInstall, onLogout }: { user: any; notificationEnabled: boolean; pwaInstall: PwaInstall; onLogout: () => void }) {
  const [installHelp, setInstallHelp] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  async function enablePush() {
    setPushMessage("");
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setPushMessage("Push notifications are not supported in this browser.");
    try {
      const { publicKey } = await api<{ publicKey: string | null }>("/push/public-key");
      if (!publicKey) return setPushMessage("Push is waiting for the server administrator to add VAPID keys.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setPushMessage("Notifications are blocked. Allow them in your browser settings and try again.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await api("/push/subscribe", { method: "POST", body: JSON.stringify(subscription) });
      setPushMessage("Reminders are now enabled on this device.");
    } catch (error: any) { setPushMessage(error.message || "Notifications could not be enabled."); }
  }
  async function installApp() {
    setInstallHelp(false);
    const result = await pwaInstall.requestInstall();
    if (result === "unavailable" || result === "dismissed") setInstallHelp(true);
  }
  async function logout() { await api("/auth/logout", { method: "POST" }); onLogout(); }
  return <div className="page"><header className="page-header compact"><div><span className="eyebrow">YOUR SPACE</span><h1>Profile &<br /><em>preferences.</em></h1></div></header>
    <section className="profile-card"><div className="avatar">{user.name.split(/\s+/).map((x: string) => x[0]).slice(0, 2).join("")}</div><div><h2>{user.name}</h2><p>@{user.username}</p></div></section>
    <div className="settings-group"><span className="eyebrow">NOTIFICATIONS</span><button onClick={enablePush}><i><BellRing /></i><span><b>Task reminders</b><small>{notificationEnabled ? "Enabled on this account" : "Get a nudge when a task is due"}</small></span><em>{notificationEnabled ? "On" : "Set up"}</em></button>{pushMessage && <p className="setting-message" role="status">{pushMessage}</p>}<button disabled><i><Moon /></i><span><b>Quiet hours</b><small>Coming after the MVP</small></span><em>—</em></button></div>
    <div className="settings-group"><span className="eyebrow">APP</span><button onClick={installApp} disabled={pwaInstall.installed}><i><Download /></i><span><b>{pwaInstall.installed ? "TaskLite installed" : "Install TaskLite"}</b><small>{pwaInstall.canInstall ? "Ready to add to your device" : "Keep it close, like an app"}</small></span><em>{pwaInstall.installed ? "Done" : pwaInstall.canInstall ? "Install" : "How"}</em></button>{pwaInstall.isIos && !pwaInstall.installed && <div className="ios-install-note"><b>Add TaskLite to your iPhone Home Screen</b><ol><li>Open this page in <strong>Safari</strong>.</li><li>Tap the <strong>Share</strong> button (the square with an upward arrow).</li><li>Scroll down and tap <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong> in the top-right corner.</li></ol><p>TaskLite will then open full-screen like a regular app.</p></div>}{installHelp && !pwaInstall.isIos && <div className="install-help" role="status"><b>Install from your browser</b><p>Open the browser menu and choose Install app or Add to Home screen. Installation may be hidden in in-app browsers—open this page in Chrome or Edge.</p></div>}<button disabled><i><ShieldCheck /></i><span><b>Privacy</b><small>Shared cards never include task names</small></span></button></div>
    <button className="logout-btn" onClick={logout}><LogOut size={18} />Sign out</button><p className="version">TaskLite v1.0 · Built for lighter days</p>
  </div>;
}
