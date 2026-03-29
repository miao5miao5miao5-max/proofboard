import { useState, useEffect, useRef } from "react";

export interface TypewriterResult {
  /** The portion of text revealed so far */
  displayed: string;
  /** Whether the blinking cursor should be visible */
  showCursor: boolean;
  /** True once all characters have been typed */
  isDone: boolean;
}

/**
 * Reveals `text` one character at a time.
 *
 * @param text        The full string to type out.
 * @param charDelay   ms between each character (default 60).
 * @param startDelay  ms to wait before typing begins (default 0).
 */
export function useTypewriter(
  text: string,
  charDelay = 60,
  startDelay = 0
): TypewriterResult {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    // Reset on text change
    setDisplayed("");
    setShowCursor(false);
    setIsDone(false);
    indexRef.current = 0;

    let intervalId: ReturnType<typeof setInterval>;

    const startTimer = setTimeout(() => {
      setShowCursor(true);

      intervalId = setInterval(() => {
        if (indexRef.current < text.length) {
          indexRef.current += 1;
          setDisplayed(text.slice(0, indexRef.current));
        } else {
          clearInterval(intervalId);
          setIsDone(true);
          // Blink cursor for 1.5 s, then fade out
          setTimeout(() => setShowCursor(false), 1500);
        }
      }, charDelay);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      clearInterval(intervalId);
    };
  }, [text, charDelay, startDelay]);

  return { displayed, showCursor, isDone };
}
