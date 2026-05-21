"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tq_consent_v1";

export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!v) setShow(true);
  }, []);

  if (!show) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accept");
    setShow(false);
    window.dispatchEvent(new CustomEvent("tq:consent", { detail: "accept" }));
  };
  const reject = () => {
    localStorage.setItem(STORAGE_KEY, "reject");
    setShow(false);
    window.dispatchEvent(new CustomEvent("tq:consent", { detail: "reject" }));
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 rounded-xl bg-white shadow-xl ring-1 ring-ink/10 p-4 text-sm"
    >
      <p className="mb-3 text-ink/80">
        We use a privacy-friendly analytics tool and may show ads. Accept to help us improve;
        reject to block all non-essential cookies.{" "}
        <a href="/cookies/" className="underline text-accent">
          Learn more
        </a>
        .
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={reject} className="px-3 py-1.5 rounded-lg text-ink/70 hover:bg-ink/5">
          Reject
        </button>
        <button
          onClick={accept}
          className="px-3 py-1.5 rounded-lg bg-accent text-white hover:opacity-90"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
