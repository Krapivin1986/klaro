import type { LocationRewrite } from "@tanstack/react-router";

/**
 * Path-based preview hosts serve the dev server under `/{port_id}/` and strip
 * that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
 * prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
 * client routing and generated links aligned with the public URL.
 */
const PATH_BASED_PREVIEW_HOSTS = new Set([
  "preview.grok.genai.mil",
  "preview.grok.mil",
  "preview.grokgsac.com",
]);

const PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;

export function previewPathPrefix(hostname: string, pathname: string): string | undefined {
  if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return undefined;
  return PORT_ID_PREFIX.exec(pathname)?.[0];
}

export function prefixRewrite(prefix: string): LocationRewrite {
  return {
    input: ({ url }) => {
      if (url.pathname === prefix) url.pathname = "/";
      else if (url.pathname.startsWith(`${prefix}/`))
        url.pathname = url.pathname.slice(prefix.length);
      return url;
    },
    output: ({ url }) => {
      url.pathname = `${prefix}${url.pathname}`;
      return url;
    },
  };
}

export function previewPathRewrite(): LocationRewrite | undefined {
  if (typeof window === "undefined") return undefined;
  const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
  return prefix ? prefixRewrite(prefix) : undefined;
}

const PAGES_PREFIX = "/klaro";

/** Project site is served under /klaro; the router still owns /. */
export function githubPagesRewrite(): LocationRewrite | undefined {
  if (typeof window === "undefined") return undefined;
  const { pathname } = window.location;
  if (pathname === PAGES_PREFIX || pathname.startsWith(`${PAGES_PREFIX}/`)) {
    return prefixRewrite(PAGES_PREFIX);
  }
  return undefined;
}

/** jsDelivr serves the same snapshot from a deep directory URL. */
export function cdnSiteRewrite(): LocationRewrite | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname.toLowerCase();
  if (!(host === "cdn.jsdelivr.net" || host.endsWith(".jsdelivr.net"))) return undefined;
  let prefix = window.location.pathname;
  if (prefix.endsWith("/index.html")) prefix = prefix.slice(0, -"/index.html".length);
  if (prefix.length > 1 && prefix.endsWith("/")) prefix = prefix.slice(0, -1);
  if (!prefix || prefix === "/") return undefined;
  return prefixRewrite(prefix);
}

export function appPathRewrite(): LocationRewrite | undefined {
  return cdnSiteRewrite() ?? githubPagesRewrite() ?? previewPathRewrite();
}
