import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

export type SpeechResult = {
  transcript: string;
  durationMs: number;
};

type VoiceModule = {
  onSpeechPartialResults: ((event: { value?: string[] }) => void) | null;
  onSpeechResults: ((event: { value?: string[] }) => void) | null;
  onSpeechError: ((event: { error?: { message?: string } }) => void) | null;
  onSpeechEnd: (() => void) | null;
  start: (locale: string) => Promise<void>;
  stop: () => Promise<void>;
  destroy: () => Promise<unknown>;
  removeAllListeners: () => void;
};

/**
 * Only require `@react-native-voice/voice` when the native module exists.
 * Importing the package while Voice is null constructs NativeEventEmitter(null)
 * and crashes Heimdall on iOS (missing pod / unlink).
 */
function loadVoiceModule(): VoiceModule | null {
  if (!NativeModules.Voice) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-voice/voice') as { default?: VoiceModule } & VoiceModule;
    return (mod.default ?? mod) as VoiceModule;
  } catch {
    return null;
  }
}

const Voice = loadVoiceModule();

async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone permission',
      message: 'Niðavellir needs the microphone for voice search and Heimdall.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function useSpeechToText(options?: {
  locale?: string;
  onFinal?: (result: SpeechResult) => void;
  onError?: (message: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const startedAt = useRef<number>(0);
  const onFinalRef = useRef(options?.onFinal);
  const onErrorRef = useRef(options?.onError);
  onFinalRef.current = options?.onFinal;
  onErrorRef.current = options?.onError;
  const locale = options?.locale ?? 'en-IN';

  useEffect(() => {
    if (!Voice) {
      return;
    }
    Voice.onSpeechPartialResults = (event) => {
      const value = event.value?.[0];
      if (value) setPartial(value);
    };
    Voice.onSpeechResults = (event) => {
      const value = event.value?.[0] ?? '';
      const durationMs = Math.max(500, Date.now() - startedAt.current);
      setPartial(value);
      setListening(false);
      if (value.trim()) {
        onFinalRef.current?.({ transcript: value.trim(), durationMs });
      }
    };
    Voice.onSpeechError = (event) => {
      setListening(false);
      const msg = String(event.error?.message ?? 'Speech recognition failed');
      if (!/cancel/i.test(msg)) {
        onErrorRef.current?.(msg);
      }
    };
    Voice.onSpeechEnd = () => {
      setListening(false);
    };

    return () => {
      void Voice.destroy().then(Voice.removeAllListeners).catch(() => undefined);
    };
  }, []);

  const stop = useCallback(async () => {
    if (!Voice) {
      setListening(false);
      return;
    }
    try {
      await Voice.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }, []);

  const start = useCallback(async () => {
    if (!Voice) {
      onErrorRef.current?.(
        'Voice input is unavailable. Rebuild the iOS app after pod install, or type your message.',
      );
      return;
    }
    const ok = await ensureMicPermission();
    if (!ok) {
      onErrorRef.current?.('Microphone permission is required for voice input.');
      return;
    }
    try {
      setPartial('');
      startedAt.current = Date.now();
      setListening(true);
      await Voice.start(locale);
    } catch {
      setListening(false);
      try {
        startedAt.current = Date.now();
        setListening(true);
        await Voice.start('en-US');
      } catch {
        setListening(false);
        onErrorRef.current?.('Voice input is unavailable on this device.');
      }
    }
  }, [locale]);

  const toggle = useCallback(async () => {
    if (listening) await stop();
    else await start();
  }, [listening, start, stop]);

  return { listening, partial, start, stop, toggle, available: Boolean(Voice) };
}
