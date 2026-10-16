import { describe, expect, it } from "vitest";
import manifestText from "../public/manifest.webmanifest?raw";
import worker from "../public/sw.js?raw";
import profile from "./pages/Profile.tsx?raw";
import taskSheet from "./components/TaskSheet.tsx?raw";

describe("PWA shell", () => {
  it("has an installable manifest", () => {
    const manifest = JSON.parse(manifestText);
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ sizes: "512x512", type: "image/png" })
    ]));
  });
  it("does not cache API responses and requests audible notifications", () => {
    expect(worker).toContain('pathname.startsWith("/api/")');
    expect(worker).toContain("silent: false");
    expect(worker).toContain('data.notificationType === "overdue"');
    expect(worker).toContain("/icons/overdue-192.png");
    expect(worker).toContain("requireInteraction: overdue");
  });
  it("prevents iOS input zoom and explains iPhone installation", () => {
    expect(taskSheet).not.toContain("autoFocus");
    expect(profile).toContain("Add TaskLite to your iPhone Home Screen");
    expect(profile).toContain("Add to Home Screen");
  });
});
