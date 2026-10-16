import { lazy, Suspense, useEffect, useState } from "react";
import { BarChart3, CalendarCheck2, UsersRound, UserRound, WifiOff } from "./icons";
import { api, ApiError } from "./api";
import { Auth } from "./Auth";
import { Today } from "./pages/Today";

const Progress = lazy(() => import("./pages/Progress").then(m => ({ default: m.Progress })));
const Shared = lazy(() => import("./pages/Shared").then(m => ({ default: m.Shared })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
type Tab = "today" | "progress" | "shared" | "profile";

export default function App() {
  const [session, setSession] = useState<any | undefined>(undefined); const [tab, setTab] = useState<Tab>("today"); const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { api<any>("/auth/me").then(setSession).catch(e => e instanceof ApiError && e.status === 401 ? setSession(null) : setSession(null)); const up = () => setOnline(true); const down = () => setOnline(false); window.addEventListener("online", up); window.addEventListener("offline", down); return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); }; }, []);
  if (session === undefined) return <div className="launch"><div className="brand-mark">✓</div><span>TaskLite</span></div>;
  if (!session) return <Auth onAuthenticated={() => api("/auth/me").then(setSession)} />;
  return <div className="app-shell">{!online && <div className="offline-banner"><WifiOff size={15} />You’re offline. Changes need a connection.</div>}
    <main className="app-main"><Suspense fallback={<div className="page"><div className="skeleton-list"><i /><i /><i /></div></div>}>{tab === "today" && <Today user={session.user} />}{tab === "progress" && <Progress />}{tab === "shared" && <Shared user={session.user} />}{tab === "profile" && <Profile user={session.user} notificationEnabled={session.notificationEnabled} onLogout={() => setSession(null)} />}</Suspense></main>
    <nav className="bottom-nav" aria-label="Main navigation">{([{ id: "today", label: "Today", icon: CalendarCheck2 }, { id: "progress", label: "Progress", icon: BarChart3 }, { id: "shared", label: "Shared", icon: UsersRound }, { id: "profile", label: "Profile", icon: UserRound }] as const).map(item => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><item.icon /><span>{item.label}</span></button>)}</nav>
  </div>;
}
