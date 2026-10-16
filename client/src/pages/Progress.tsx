import { useEffect, useState } from "react";
import { Award } from "../icons";
import type { ProgressResponse } from "@tasklite/shared";
import { api } from "../api";

export function Progress() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly"); const [data, setData] = useState<ProgressResponse | null>(null);
  useEffect(() => { setData(null); api<ProgressResponse>(`/progress/${period}`).then(setData); }, [period]);
  const max = Math.max(100, ...(data?.points?.map(x => x.percentage || 0) || []));
  return <div className="page"><header className="page-header compact"><div><span className="eyebrow">YOUR MOMENTUM</span><h1>Progress,<br /><em>not pressure.</em></h1></div></header>
    <div className="segmented">{(["daily", "weekly", "monthly"] as const).map(x => <button className={period === x ? "active" : ""} onClick={() => setPeriod(x)} key={x}>{x[0].toUpperCase() + x.slice(1)}</button>)}</div>
    {!data ? <div className="skeleton-chart" /> : <><section className="score-card"><span className="eyebrow">{data.label.toUpperCase()}</span><div className="score-line"><strong>{data.percentage == null ? "—" : `${data.percentage}%`}</strong><span className={`status-pill ${data.status}`}><Award size={15} />{data.status === "passed" ? "Passed" : data.status === "keep-going" ? "Keep going" : "No score"}</span></div><p>{data.completed} of {data.total} scheduled tasks completed</p></section>
      {data.points && <section className="chart-card"><div className="chart-bars">{data.points.map(point => <div className="bar-column" key={point.label}><div className="bar-value">{point.percentage == null ? "—" : `${point.percentage}%`}</div><div className="bar-track"><i style={{ height: `${((point.percentage || 0) / max) * 100}%` }} className={(point.percentage || 0) >= 70 ? "pass" : ""} /></div><span>{point.label}</span></div>)}</div><div className="threshold"><i />70% pass line</div></section>}
      <section className="insight-card"><div className="insight-icon">↗</div><div><span className="eyebrow">A SMALL WIN</span><h3>{data.percentage == null ? "Start with one clear task." : data.status === "passed" ? "You’re keeping a steady pace." : "Every finished task moves the line."}</h3><p>No streaks, no guilt. Just an honest look at what got done.</p></div></section></>}
  </div>;
}
