// Whatsapp tests cover channel logout plugin behavior.
import type { RuntimeEnv } from "openclaw/plugin-sdk/runtime-env";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { whatsappPlugin } from "./channel.js";
import {
  clearWebAuthLoggedOut,
  isWebAuthLoggedOut,
  markWebAuthLoggedOut,
} from "./web-auth-terminal-state.js";

const hoisted = vi.hoisted(() => ({
  logoutWeb: vi.fn(async () => true),
}));

const workAuthState = {
  accountId: "work",
  authDir: "/tmp/openclaw-whatsapp-work",
};

function logoutWorkAccount() {
  return whatsappPlugin.gateway?.logoutAccount?.({
    cfg: { channels: { whatsapp: {} } },
    accountId: workAuthState.accountId,
    account: {
      accountId: workAuthState.accountId,
      authDir: workAuthState.authDir,
      enabled: true,
      isLegacyAuthDir: false,
      sendReadReceipts: false,
    },
    runtime: { log: vi.fn(), error: vi.fn(), exit: vi.fn() } as RuntimeEnv,
  });
}

vi.mock("./channel.runtime.js", () => ({
  logoutWeb: hoisted.logoutWeb,
}));

describe("WhatsApp channel logout", () => {
  beforeEach(() => {
    hoisted.logoutWeb.mockClear();
    clearWebAuthLoggedOut(workAuthState);
  });

  afterEach(() => {
    clearWebAuthLoggedOut(workAuthState);
  });

  it("clears terminal logged-out state after explicit logout", async () => {
    markWebAuthLoggedOut(workAuthState);

    const result = await logoutWorkAccount();

    expect(result).toEqual({ cleared: true, loggedOut: true });
    expect(hoisted.logoutWeb).toHaveBeenCalledWith({
      authDir: workAuthState.authDir,
      isLegacyAuthDir: false,
      runtime: expect.anything(),
    });
    expect(isWebAuthLoggedOut(workAuthState)).toBe(false);
  });

  it("keeps terminal logged-out state when logout leaves auth in place", async () => {
    hoisted.logoutWeb.mockResolvedValueOnce(false);
    markWebAuthLoggedOut(workAuthState);

    const result = await logoutWorkAccount();

    expect(result).toEqual({ cleared: false, loggedOut: false });
    expect(isWebAuthLoggedOut(workAuthState)).toBe(true);
  });
});
