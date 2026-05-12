"use client";

import { forwardRef, useEffect, useRef } from "react";

interface Props {
  onChar: (ch: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

export const HiddenInput = forwardRef<HTMLInputElement, Props>(function HiddenInput(
  { onChar, onBackspace, disabled },
  fwdRef,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastValue = useRef<string>("");

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof fwdRef === "function") fwdRef(el);
    else if (fwdRef) (fwdRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
    if (!disabled) el.focus();
  }, [fwdRef, disabled]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="text"
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      spellCheck={false}
      aria-label="Type here to play"
      className="sr-only"
      disabled={disabled}
      onInput={(e) => {
        const v = e.currentTarget.value;
        const prev = lastValue.current;
        if (v.length > prev.length) {
          const added = v.slice(prev.length);
          for (const ch of added) onChar(ch);
        } else if (v.length < prev.length) {
          for (let i = 0; i < prev.length - v.length; i++) onBackspace();
        }
        lastValue.current = v;
        if (v.length > 24) {
          e.currentTarget.value = "";
          lastValue.current = "";
        }
      }}
      onBlur={(e) => {
        if (!disabled) setTimeout(() => e.currentTarget?.focus(), 30);
      }}
    />
  );
});
