function isEnglish(voice: SpeechSynthesisVoice) {
  return voice.lang.toLowerCase().startsWith("en");
}

function looksFemale(voice: SpeechSynthesisVoice) {
  return /female|woman|zira|samantha|victoria|karen|moira|tessa|veena|fiona|susan|hazel|aria|jenny|sara|linda|heera|eva|natasha|catherine/i.test(
    `${voice.name} ${voice.voiceURI}`
  );
}

function looksMale(voice: SpeechSynthesisVoice) {
  return /male|david|mark|daniel|fred|alex|ravi|george/i.test(
    `${voice.name} ${voice.voiceURI}`
  );
}

export function pickWelcomeVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const english = voices.filter(isEnglish);
  const pool = english.length ? english : voices;

  return (
    pool.find(looksFemale) ??
    pool.find((voice) => !looksMale(voice)) ??
    pool[0] ??
    null
  );
}

function applyPreferredVoice(utterance: SpeechSynthesisUtterance) {
  const voice = pickWelcomeVoice(window.speechSynthesis.getVoices());
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || "en-US";
  }
}

export function speakWelcomeMessage(
  text: string,
  onBlocked?: () => void
): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onBlocked?.();
    return false;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    utterance.lang = "en-US";
    applyPreferredVoice(utterance);

    if (!utterance.voice) {
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        () => applyPreferredVoice(utterance),
        { once: true }
      );
    }

    utterance.onerror = () => {
      onBlocked?.();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    onBlocked?.();
    return false;
  }
}
