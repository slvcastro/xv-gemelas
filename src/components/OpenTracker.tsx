"use client";

import { useEffect } from "react";
import { markOpened } from "@/app/actions/invitations";

/** Tells the panel that a person (not a link-preview bot) opened this invitation. Renders nothing. */
export function OpenTracker({ token }: { token: string }) {
  useEffect(() => {
    markOpened(token);
  }, [token]);
  return null;
}
