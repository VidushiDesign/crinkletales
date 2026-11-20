// Talk mode: the browser's own speech-to-text (Chrome, Edge, Safari).
// Audio is handled by the browser. We never store recordings.

export function speechSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Starts listening. Calls onText(finalText, interimText) as words arrive,
// onError(reason) if the mic is blocked or missing, onEnd() when it stops.
export function startListening({ onText, onError, onEnd, lang = 'en-IN' }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onError?.('unsupported');
    return () => {};
  }
  let rec;
  let stopped = false;
  let finalText = '';
  try {
    rec = new SR();
  } catch {
    onError?.('unsupported');
    return () => {};
  }
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript.trim() + '. ';
      else interim += r[0].transcript;
    }
    onText?.(finalText, interim);
  };
  rec.onerror = (e) => onError?.(e.error || 'error');
  rec.onend = () => {
    // Chrome stops after silence. Restart unless the user stopped it.
    if (!stopped) {
      try {
        rec.start();
        return;
      } catch {
        /* fall through */
      }
    }
    onEnd?.();
  };
  try {
    rec.start();
  } catch {
    onError?.('error');
  }
  return () => {
    stopped = true;
    try {
      rec.stop();
    } catch {
      /* already stopped */
    }
  };
}
