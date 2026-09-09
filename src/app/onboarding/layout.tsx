import type { ReactNode } from "react";

// Calls Firebase Auth + a Cloud Function at submit time — never prerendered at build time.
export const dynamic = "force-dynamic";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
