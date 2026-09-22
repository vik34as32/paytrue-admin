function voiceLabel(voice: SpeechSynthesisVoice) {
  return `${voice.name} ${voice.voiceURI} ${voice.lang}`.toLowerCase();
}

function isIndianLocale(voice: SpeechSynthesisVoice) {
  return /^(en-in|hi-in|hi)/i.test(voice.lang) || /\bindia\b|\bindian\b|\ben-in\b|\bhi-in\b/.test(voiceLabel(voice));
}

function looksIndianFemale(voice: SpeechSynthesisVoice) {
  return /heera|neerja|veena|swara|priya|kalpana|padma|ananya|shruti|kavya|meera|isha|aditi|google हिन्दी|google hindi/i.test(
    voiceLabel(voice)
  );
}

function looksFemale(voice: SpeechSynthesisVoice) {
  return (
    looksIndianFemale(voice) ||
    /female|woman|girl|zira|samantha|victoria|karen|aria|jenny|sara|linda/i.test(
      voiceLabel(voice)
    )
  );
}

function looksMale(voice: SpeechSynthesisVoice) {
  return /male|ravi|hemant|prabhat|david|mark|daniel|fred|alex|george/i.test(
    voiceLabel(voice)
  );
}

export function pickWelcomeVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const englishIndia = voices.filter(
    (voice) =>
      /^en-in/i.test(voice.lang) ||
      /english \(india\)|\ben-in\b/.test(voiceLabel(voice))
  );

  const pickFemale = (pool: SpeechSynthesisVoice[]) =>
    pool.find((voice) => looksIndianFemale(voice) && !looksMale(voice)) ??
    pool.find((voice) => looksFemale(voice) && !looksMale(voice)) ??
    pool.find((voice) => !looksMale(voice));

  return (
    pickFemale(englishIndia) ??
    pickFemale(voices.filter(looksIndianFemale)) ??
    pickFemale(voices.filter(isIndianLocale)) ??
    pickFemale(
      voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"))
    ) ??
    voices[0] ??
    null
  );
}

function applyPreferredVoice(
  utterance: SpeechSynthesisUtterance,
  voices: SpeechSynthesisVoice[]
) {
  const voice = pickWelcomeVoice(voices);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = /hi/i.test(voice.lang) ? "en-IN" : voice.lang || "en-IN";
  } else {
    utterance.lang = "en-IN";
  }
}

function whenVoicesReady(callback: (voices: SpeechSynthesisVoice[]) => void) {
  const existing = window.speechSynthesis.getVoices();
  if (existing.length) {
    callback(existing);
    return;
  }

  const finish = () => callback(window.speechSynthesis.getVoices());
  window.speechSynthesis.addEventListener("voiceschanged", finish, {
    once: true,
  });
  window.setTimeout(finish, 300);
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
    whenVoicesReady((voices) => {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.15;
        utterance.volume = 0.8;
        utterance.lang = "en-IN";
        applyPreferredVoice(utterance, voices);

        utterance.onerror = () => {
          onBlocked?.();
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        onBlocked?.();
      }
    });
    return true;
  } catch {
    onBlocked?.();
    return false;
  }
}
