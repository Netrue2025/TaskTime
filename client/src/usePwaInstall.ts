import { useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global { interface Navigator { standalone?: boolean; } }

export function usePwaInstall() {
  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const isIos = useMemo(() => /iphone|ipad|ipod/i.test(navigator.userAgent), []);

  useEffect(() => {
    const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  async function requestInstall() {
    if (!prompt) return "unavailable" as const;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") { setInstalled(true); setPrompt(null); }
    return choice.outcome;
  }

  return { canInstall: Boolean(prompt), installed, isIos, requestInstall };
}
