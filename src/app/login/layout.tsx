import type { ReactNode } from "react";

// Reads live Firebase Auth client state — never prerendered at build time.
export const dynamic = "force-dynamic";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
