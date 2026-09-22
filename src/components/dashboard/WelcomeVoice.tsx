"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SUPER_ADMIN_WELCOME_TEXT,
  consumeSuperAdminWelcome,
} from "@/lib/superAdminWelcome";
import { speakWelcomeMessage } from "@/lib/welcomeSpeech";

const OVERLAY_MS = 2600;

export function WelcomeVoice() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const hideOverlay = useCallback(() => {
    setLeaving(true);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => {
        setVisible(false);
        setLeaving(false);
      },
      reduce ? 0 : 280
    );
  }, []);

  const playSpeech = useCallback((manual = false) => {
    const blocked = () => {
      if (!manual) setShowReplay(true);
    };
    try {
      const started = speakWelcomeMessage(SUPER_ADMIN_WELCOME_TEXT, blocked);
      if (started) setShowReplay(false);
      return started;
    } catch {
      blocked();
      return false;
    }
  }, []);

  useEffect(() => {
    if (!consumeSuperAdminWelcome()) return;

    const showId = window.setTimeout(() => {
      setVisible(true);
      playSpeech(false);
    }, 0);
    hideTimer.current = window.setTimeout(hideOverlay, OVERLAY_MS);

    return () => {
      window.clearTimeout(showId);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // Speech cleanup is best-effort.
      }
    };
  }, [hideOverlay, playSpeech]);

  if (!visible && !showReplay) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4 sm:top-24"
      aria-live="polite"
    >
      {visible ? (
        <div
          className={`welcome-voice-card max-w-[min(100%,20rem)] rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-6 py-5 text-center shadow-lg ${
            leaving ? "is-leaving" : ""
          }`}
        >
          <p className="text-sm font-medium text-[color:var(--muted)]">
            Welcome 👋
          </p>
          <p className="mt-1 text-base font-semibold leading-snug text-[color:var(--card-foreground)] sm:text-lg">
            Welcome to PayTrue
            <br />
            Super Admin Dashboard
          </p>
          <div
            className="mt-3 flex items-center justify-center gap-1.5"
            aria-hidden
          >
            <span className="welcome-voice-dot" />
            <span className="welcome-voice-dot delay-2" />
            <span className="welcome-voice-dot delay-3" />
          </div>
        </div>
      ) : null}

      {showReplay && !visible ? (
        <button
          type="button"
          className="pointer-events-auto rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-1.5 text-xs font-medium text-[color:var(--muted)] shadow-sm transition hover:text-[color:var(--card-foreground)]"
          onClick={() => {
            setVisible(true);
            setLeaving(false);
            playSpeech(true);
            if (hideTimer.current) window.clearTimeout(hideTimer.current);
            hideTimer.current = window.setTimeout(hideOverlay, OVERLAY_MS);
          }}
        >
          🔊 Welcome
        </button>
      ) : null}
    </div>
  );
}
