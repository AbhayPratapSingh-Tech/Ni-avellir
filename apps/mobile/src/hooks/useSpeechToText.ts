import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Voice from '@react-native-voice/voice';

export type SpeechResult = {
  transcript: string;
  durationMs: number;
};

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
      void Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const stop = useCallback(async () => {
    try {
      await Voice.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }, []);

  const start = useCallback(async () => {
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
      // Fallback locale
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

  return { listening, partial, start, stop, toggle };
}
