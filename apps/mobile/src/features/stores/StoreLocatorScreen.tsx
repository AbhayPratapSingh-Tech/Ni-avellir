import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StoreLocation } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { AppIcon } from '../../components/ui/AppIcon';
import { storeRepository } from '../../services/data/storeRepository';
import { useToast } from '../../components/ui/Toast';

type WebViewComponent = typeof import('react-native-webview').WebView;
type WebViewRef = import('react-native-webview').WebView;

let CachedWebView: WebViewComponent | null | undefined;

function getWebView(): WebViewComponent | null {
  if (CachedWebView !== undefined) return CachedWebView;
  try {
    CachedWebView = require('react-native-webview').WebView as WebViewComponent;
  } catch {
    CachedWebView = null;
  }
  return CachedWebView;
}

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629, zoom: 5 };
const MAP_HEIGHT = Math.min(420, Math.round(Dimensions.get('window').height * 0.52));

function buildMapHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #E8EEF4; }
    .leaflet-container { font: 12px/1.4 system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, scrollWheelZoom: true }).setView(
      [${DEFAULT_CENTER.lat}, ${DEFAULT_CENTER.lng}],
      ${DEFAULT_CENTER.zoom}
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    var storeLayer = L.layerGroup().addTo(map);
    var searchMarker = null;

    function fixSize() {
      setTimeout(function () {
        map.invalidateSize(true);
      }, 50);
      setTimeout(function () {
        map.invalidateSize(true);
      }, 300);
    }
    fixSize();

    function renderStores(list) {
      storeLayer.clearLayers();
      (list || []).forEach(function (s) {
        L.marker([s.lat, s.lng]).addTo(storeLayer).bindPopup(s.name || 'Store');
      });
      fixSize();
    }

    function flyTo(lat, lng, zoom) {
      fixSize();
      map.flyTo([lat, lng], zoom || 13, { duration: 0.85 });
    }

    function setSearchPin(lat, lng, label, zoom) {
      if (searchMarker) map.removeLayer(searchMarker);
      searchMarker = L.marker([lat, lng]).addTo(map);
      if (label) searchMarker.bindPopup(label).openPopup();
      flyTo(lat, lng, zoom || 6);
    }

    function handleMessage(raw) {
      try {
        var msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!msg || !msg.type) return;
        if (msg.type === 'fix') fixSize();
        if (msg.type === 'fly') flyTo(msg.lat, msg.lng, msg.zoom);
        if (msg.type === 'searchPin') setSearchPin(msg.lat, msg.lng, msg.label || '', msg.zoom);
        if (msg.type === 'stores') renderStores(msg.stores || []);
      } catch (e) {}
    }

    document.addEventListener('message', function (e) { handleMessage(e.data); });
    window.addEventListener('message', function (e) { handleMessage(e.data); });
  </script>
</body>
</html>`;
}

export function StoreLocatorScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const webRef = useRef<WebViewRef>(null);
  const searchRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const WebView = getWebView();

  const mapHtml = useMemo(() => buildMapHtml(), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const list = await storeRepository.list();
      if (!cancelled) {
        setStores(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const postToMap = useCallback((payload: Record<string, unknown>) => {
    const json = JSON.stringify(payload);
    webRef.current?.postMessage(json);
    webRef.current?.injectJavaScript(
      `(function(){try{var d=${JSON.stringify(json)};window.dispatchEvent(new MessageEvent('message',{data:d}));}catch(e){} true;})();`,
    );
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    postToMap({ type: 'fix' });
    postToMap({
      type: 'stores',
      stores: stores.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng })),
    });
  }, [mapReady, stores, postToMap]);

  const selectStore = (store: StoreLocation) => {
    setSelectedId(store.id);
    postToMap({ type: 'fly', lat: store.lat, lng: store.lng, zoom: 14 });
  };

  const runGeocode = async () => {
    const q = query.trim();
    if (q.length < 2) {
      toast.show('Enter a city, state, or area');
      return;
    }
    Keyboard.dismiss();
    setGeocoding(true);
    const result = await storeRepository.geocode(q);
    setGeocoding(false);
    if (!result) {
      toast.show('Area not found — redeploy API if /stores/geocode is missing');
      return;
    }
    const zoom = /india/i.test(q) && !/,/.test(q) ? 5 : 12;
    postToMap({
      type: 'searchPin',
      lat: result.lat,
      lng: result.lng,
      label: result.displayName,
      zoom,
    });
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>Search an area to move the map. Store cards appear when locations are seeded.</Text>

        <View style={styles.searchRow}>
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="City, state, or area…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void runGeocode()}
            returnKeyType="search"
            autoCorrect={false}
          />
          <Pressable
            style={styles.searchBtn}
            onPress={() => void runGeocode()}
            accessibilityRole="button"
            accessibilityLabel="Search area"
          >
            {geocoding ? (
              <ActivityIndicator color={colors.onAccent} size="small" />
            ) : (
              <AppIcon name="search" size={20} color={colors.onAccent} />
            )}
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : stores.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cards}
            style={styles.cardList}
          >
            {stores.map((item) => {
              const active = item.id === selectedId;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() => selectStore(item)}
                >
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardCity} numberOfLines={1}>
                    {item.city}
                    {item.state ? `, ${item.state}` : ''}
                  </Text>
                  <Text style={styles.cardAddress} numberOfLines={2}>
                    {item.address}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.mapBox}>
          {WebView ? (
            <WebView
              ref={webRef}
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={styles.map}
              javaScriptEnabled
              domStorageEnabled
              nestedScrollEnabled
              setSupportMultipleWindows={false}
              onLoadEnd={() => {
                setMapReady(true);
                postToMap({ type: 'fix' });
              }}
              onShouldStartLoadWithRequest={() => true}
            />
          ) : (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackText}>Map unavailable in this build</Text>
            </View>
          )}
          <Pressable
            style={styles.magnifyFab}
            onPress={() => {
              searchRef.current?.focus();
              if (query.trim().length >= 2) {
                void runGeocode();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Focus area search"
          >
            <AppIcon name="search" size={22} color={colors.text} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: spacing.sm,
    padding: spacing.md,
    width: 200,
  },
  cardActive: {
    borderColor: colors.accent,
  },
  cardAddress: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  cardCity: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardList: {
    flexGrow: 0,
    marginBottom: spacing.md,
    maxHeight: 118,
  },
  cardName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  cards: {
    paddingRight: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  loadingRow: {
    paddingVertical: spacing.sm,
  },
  magnifyFab: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    bottom: spacing.md,
    elevation: 3,
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    width: 48,
  },
  map: {
    backgroundColor: '#E8EEF4',
    flex: 1,
  },
  mapBox: {
    backgroundColor: '#E8EEF4',
    borderRadius: 16,
    height: MAP_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  mapFallback: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  mapFallbackText: {
    color: colors.textMuted,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  searchBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    height: 48,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
});
