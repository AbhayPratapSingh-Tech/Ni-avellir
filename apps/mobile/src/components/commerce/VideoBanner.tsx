import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type { WebView as WebViewType } from 'react-native-webview';
import { colors, spacing } from '../../theme/tokens';
import { appConfig } from '../../config/appConfig';

type WebViewComponent = typeof import('react-native-webview').WebView;

let CachedWebView: WebViewComponent | null | undefined;

/** Third-party origin only — youtube.com as baseUrl triggers error 152-4. */
const EMBED_ORIGIN = 'https://ni-avellir.onrender.com';

function getWebView(): WebViewComponent | null {
  if (CachedWebView !== undefined) return CachedWebView;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    CachedWebView = require('react-native-webview').WebView as WebViewComponent;
  } catch {
    CachedWebView = null;
  }
  return CachedWebView;
}

function youtubeVideoId(): string | null {
  const configured = appConfig.videoBanner.youtubeId?.trim();
  if (configured) return configured;

  const raw = appConfig.videoBanner.uri?.trim() ?? '';
  if (!raw) return null;

  const short = raw.match(/youtu\.be\/([\w-]{6,})/i);
  if (short?.[1]) return short[1];

  const watch = raw.match(/[?&]v=([\w-]{6,})/i);
  if (watch?.[1]) return watch[1];

  const embed = raw.match(/youtube(?:-nocookie)?\.com\/(?:embed|shorts)\/([\w-]{6,})/i);
  if (embed?.[1]) return embed[1];

  if (/^[\w-]{6,}$/.test(raw)) return raw;
  return null;
}

/**
 * Clean in-app look: crop YouTube chrome, autoplay muted, loop.
 * Explicit pause/resume/mute APIs — toggles were getting out of sync.
 */
function embedHtml(videoId: string) {
  const origin = encodeURIComponent(EMBED_ORIGIN);
  const src =
    `https://www.youtube.com/embed/${videoId}` +
    `?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1` +
    `&controls=0&fs=0&disablekb=1&iv_load_policy=3&cc_load_policy=0` +
    `&loop=1&playlist=${videoId}` +
    `&enablejsapi=1&origin=${origin}`;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <style>
      html, body {
        margin: 0; padding: 0; width: 100%; height: 100%;
        background: #000; overflow: hidden;
      }
      .crop {
        position: absolute;
        inset: 0;
        overflow: hidden;
        background: #000;
      }
      .crop iframe {
        position: absolute;
        border: 0;
        top: 50%;
        left: 50%;
        width: 300%;
        height: 300%;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
    </style>
  </head>
  <body>
    <div class="crop">
      <iframe
        id="player"
        src="${src}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        playsinline
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>
    <script>
      var muted = true;
      var userPaused = false;
      function post(cmd, args) {
        var frame = document.getElementById('player');
        if (!frame || !frame.contentWindow) return;
        frame.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: cmd,
          args: args || []
        }), '*');
      }
      function applyMute() {
        post(muted ? 'mute' : 'unMute');
      }
      function restart() {
        if (userPaused) return;
        post('seekTo', [0, true]);
        post('playVideo');
        applyMute();
      }
      window.addEventListener('message', function (e) {
        try {
          var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (!data) return;
          var state = data.info && typeof data.info.playerState === 'number'
            ? data.info.playerState
            : (typeof data.info === 'number' ? data.info : null);
          if (state === 0) restart();
        } catch (err) {}
      });
      setTimeout(function () {
        post('addEventListener', ['onStateChange']);
        var frame = document.getElementById('player');
        if (frame && frame.contentWindow) {
          frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*');
        }
        post('playVideo');
        applyMute();
      }, 600);
      window.pausePlayer = function () {
        userPaused = true;
        post('pauseVideo');
      };
      window.resumePlayer = function () {
        userPaused = false;
        post('playVideo');
        applyMute();
      };
      window.setMute = function (next) {
        muted = !!next;
        applyMute();
      };
    </script>
  </body>
</html>`;
}

function PosterFallback({ title }: { title: string }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: appConfig.videoBanner.poster }} style={styles.poster} resizeMode="cover" />
      <View style={styles.overlay}>
        <Text style={styles.kicker}>Video drop</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

function InlinePlayer({ videoId }: { videoId: string }) {
  const webRef = useRef<WebViewType>(null);
  const [loading, setLoading] = useState(true);
  const [booting, setBooting] = useState(true);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const WebView = getWebView();
  const thumbUri = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const hideChrome = booting || paused || loading;

  useEffect(() => {
    if (!booting) return;
    const t = setTimeout(() => setBooting(false), 1800);
    return () => clearTimeout(t);
  }, [booting]);

  if (!WebView) {
    return <PosterFallback title="Rebuild app to play video" />;
  }

  const run = (js: string) => {
    webRef.current?.injectJavaScript(`${js}; true;`);
  };

  const onToggleMute = (e: GestureResponderEvent) => {
    e.stopPropagation?.();
    const next = !muted;
    setMuted(next);
    run(`window.setMute && window.setMute(${next ? 'true' : 'false'})`);
  };

  const onTogglePlay = () => {
    if (paused) {
      setPaused(false);
      // Explicit resume — do not toggle (was getting stuck after pause).
      run('window.resumePlayer && window.resumePlayer()');
    } else {
      setPaused(true);
      run('window.pausePlayer && window.pausePlayer()');
    }
  };

  return (
    <View style={styles.card}>
      <WebView
        ref={webRef}
        source={{ html: embedHtml(videoId), baseUrl: EMBED_ORIGIN }}
        style={styles.webview}
        scrollEnabled={false}
        userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        allowsFullscreenVideo={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        nestedScrollEnabled={false}
        setSupportMultipleWindows={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setBooting(false);
        }}
      />

      {/* Covers YouTube skip/play chrome on start + when paused. pointerEvents none so play works. */}
      {hideChrome ? (
        <View style={styles.pauseCover} pointerEvents="none">
          <Image source={{ uri: thumbUri }} style={styles.poster} resizeMode="cover" />
          <View style={styles.pauseDim} />
        </View>
      ) : null}

      <Pressable style={styles.hitArea} onPress={onTogglePlay}>
        {paused ? (
          <View style={styles.playBadge}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable style={styles.muteBtn} onPress={onToggleMute} hitSlop={8}>
        <Text style={styles.muteText}>{muted ? 'Unmute' : 'Mute'}</Text>
      </Pressable>

      {loading ? (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={colors.onAccent} />
        </View>
      ) : null}
    </View>
  );
}

export function VideoBanner() {
  const videoId = youtubeVideoId();
  if (!videoId) {
    return <PosterFallback title="Video coming soon" />;
  }

  return <InlinePlayer videoId={videoId} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#000',
    borderRadius: 18,
    height: 200,
    overflow: 'hidden',
  },
  hitArea: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  kicker: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    zIndex: 4,
  },
  muteBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    bottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
    right: 10,
    zIndex: 3,
  },
  muteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.md,
  },
  pauseCover: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  pauseDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  playBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  playIcon: {
    color: '#fff',
    fontSize: 22,
    marginLeft: 3,
  },
  poster: {
    height: '100%',
    width: '100%',
  },
  title: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  webview: {
    backgroundColor: '#000',
    flex: 1,
  },
});
