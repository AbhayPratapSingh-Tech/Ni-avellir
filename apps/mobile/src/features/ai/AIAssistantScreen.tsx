import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AIResponse, Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { ProductCard } from '../../components/commerce/ProductCard';
import { MicButton, AssistantRobotMark } from '../../components/ui/MicButton';
import { VoiceMessageBubble } from '../../components/ai/VoiceMessageBubble';
import { useToast } from '../../components/ui/Toast';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { appConfig } from '../../config/appConfig';
import { useAppSelector } from '../../app/store';
import { cartRepository } from '../../services/data/cartRepository';
import { wishlistRepository } from '../../services/data/wishlistRepository';
import { orderRepository } from '../../services/data/orderRepository';
import {
  aiApi,
  friendlyAiError,
  productsFromAiResponse,
} from '../../services/ai/aiApi';
import { goBackOrHome } from '../../lib/navigation';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
  voice?: { transcript: string; durationMs: number };
  products?: Product[];
  responseType?: AIResponse['type'];
  cartSummary?: string;
  orderSummary?: string;
  error?: boolean;
};

const STORAGE_KEY = 'nidavellir.ai.conversationId';
const QUICK = [
  'Find merch',
  'Gift ideas',
  'My cart',
  'Track order',
  'Wishlist',
  'Returns',
] as const;

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export type AIAssistantPanelProps = {
  presentation?: 'screen' | 'sheet';
  onClose?: () => void;
  initialMode?: 'hub' | 'chat' | 'talk';
};

export function AIAssistantPanel({
  presentation = 'screen',
  onClose,
  initialMode,
}: AIAssistantPanelProps) {
  const navigation = useNavigation<Navigation>();
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const voiceEnabled = appConfig.features.voiceInput;
  const insets = useSafeAreaInsets();
  const isSheet = presentation === 'sheet';

  const startMode = initialMode === 'talk' || initialMode === 'chat' ? 'chat' : 'hub';
  const [mode, setMode] = useState<'hub' | 'chat'>(startMode);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const autoTalkStarted = useRef(false);

  const firstName = useMemo(() => {
    if (!user || user.isGuest) return '';
    return (user.name || '').split(' ')[0] || '';
  }, [user]);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((id) => {
      if (id) setConversationId(id);
    });
  }, []);

  const persistConversation = useCallback(async (id: string) => {
    setConversationId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    else goBackOrHome(navigation);
  }, [navigation, onClose]);

  const refreshCommerce = useCallback(
    async (response: AIResponse) => {
      if (response.type === 'cart') {
        try {
          await cartRepository.refresh();
        } catch {
          // ignore
        }
      }
      if (response.type === 'wishlist' && user && !user.isGuest) {
        try {
          await wishlistRepository.syncToStore();
        } catch {
          // ignore
        }
      }
      if (response.type === 'order' && user && !user.isGuest) {
        try {
          await orderRepository.syncToStore();
        } catch {
          // ignore
        }
      }
    },
    [user],
  );

  const sendText = useCallback(
    async (raw: string, voice?: { transcript: string; durationMs: number }) => {
      const text = raw.trim();
      if (!text || sending) return;
      if (!appConfig.features.aiAssistant) {
        toast.show('Heimdall is disabled');
        return;
      }

      setMode('chat');
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
        createdAt: Date.now(),
        voice,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setSending(true);

      try {
        const response = await aiApi.sendMessage({
          conversationId,
          message: text,
        });
        await persistConversation(response.conversationId);
        await refreshCommerce(response);

        const products = productsFromAiResponse(response);
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: response.message,
          createdAt: Date.now(),
          products: products.length ? products : undefined,
          responseType: response.type,
          error: response.type === 'error',
          cartSummary:
            response.type === 'cart'
              ? `${response.cart.itemCount} items · ₹${response.cart.total}`
              : undefined,
          orderSummary:
            response.type === 'order'
              ? `${response.order.orderNumber} · ${response.order.status}`
              : undefined,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text: friendlyAiError(error),
            createdAt: Date.now(),
            error: true,
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [conversationId, persistConversation, refreshCommerce, sending, toast],
  );

  const speech = useSpeechToText({
    onFinal: ({ transcript, durationMs }) => {
      if (mode === 'hub' || initialMode === 'talk') {
        void sendText(transcript, { transcript, durationMs });
      } else {
        setInput(transcript);
      }
    },
    onError: (message) => toast.show(message),
  });

  useEffect(() => {
    if (initialMode === 'talk' && voiceEnabled && !autoTalkStarted.current) {
      autoTalkStarted.current = true;
      setMode('chat');
      void speech.start();
    }
    if (initialMode === 'chat') {
      setMode('chat');
    }
  }, [initialMode, speech, voiceEnabled]);

  useEffect(() => {
    if (speech.listening && speech.partial) {
      setInput(speech.partial);
    }
  }, [speech.listening, speech.partial]);

  const openProduct = useCallback(
    (product: Product) => {
      if (isSheet) onClose?.();
      navigation.navigate('ProductDetail', { product });
    },
    [isSheet, navigation, onClose],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    void AsyncStorage.removeItem(STORAGE_KEY);
    setMode('hub');
  }, []);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser ? <AssistantRobotMark size={28} /> : null}
        <View style={styles.msgCol}>
          {item.voice ? (
            <VoiceMessageBubble transcript={item.voice.transcript} durationMs={item.voice.durationMs} />
          ) : (
            <View
              style={[
                styles.bubble,
                isUser ? styles.userBubble : styles.botBubble,
                item.error && styles.errorBubble,
              ]}
            >
              <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{item.text}</Text>
            </View>
          )}
          {item.cartSummary ? <Text style={styles.metaChip}>{item.cartSummary}</Text> : null}
          {item.orderSummary ? <Text style={styles.metaChip}>{item.orderSummary}</Text> : null}
          {item.products?.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productTrack}
            >
              {item.products.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <ProductCard product={product} compact onPress={openProduct} />
                </View>
              ))}
            </ScrollView>
          ) : null}
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  const body =
    mode === 'hub' ? (
      <>
        <View style={[styles.hubHeader, isSheet && { paddingTop: spacing.sm }]}>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={styles.back}>{isSheet ? '✕' : '‹'}</Text>
          </Pressable>
          <Text style={styles.hubTitle}>Heimdall</Text>
          <View style={{ width: 28 }} />
        </View>
        <ScrollView contentContainerStyle={styles.hubContent}>
          <View style={styles.greetRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greet, isSheet && styles.greetSheet]}>
                Hi{firstName ? ` ${firstName}` : ' there'}! How can I help you today?
              </Text>
              <Text style={styles.greetSub}>
                Your personal Guide and Niðavellir Partner Heimdall
              </Text>
            </View>
            <AssistantRobotMark size={isSheet ? 52 : 64} />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {QUICK.map((label) => (
              <Pressable
                key={label}
                style={styles.chip}
                onPress={() => {
                  const prompts: Record<(typeof QUICK)[number], string> = {
                    'Find merch': 'Show me popular merch',
                    'Gift ideas': 'Gift ideas under 3000',
                    'My cart': 'Show my cart',
                    'Track order': 'Where is my order?',
                    Wishlist: 'Show my wishlist',
                    Returns: 'What is your return policy?',
                  };
                  void sendText(prompts[label]);
                }}
              >
                <Text style={styles.chipText}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.cardRow}>
            {voiceEnabled ? (
              <Pressable
                style={styles.modeCard}
                onPress={() => {
                  setMode('chat');
                  void speech.start();
                }}
              >
                <View style={styles.modeIcon}>
                  <View style={styles.modeMicOnly}>
                    <Text style={styles.modeIconGlyph}>🎙</Text>
                  </View>
                </View>
                <Text style={styles.modeTitle}>Talk with Heimdall</Text>
                <Text style={styles.modeSub}>Chat naturally and get instant answers.</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.modeCard, !voiceEnabled && styles.modeCardWide]}
              onPress={() => setMode('chat')}
            >
              <View style={styles.modeIconAlt}>
                <Text style={styles.modeIconGlyph}>💬</Text>
              </View>
              <Text style={styles.modeTitle}>Chat with Heimdall</Text>
              <Text style={styles.modeSub}>Get responses and advice in real time.</Text>
            </Pressable>
          </View>
        </ScrollView>
      </>
    ) : (
      <>
        <View style={[styles.chatHeader, isSheet && { paddingTop: spacing.sm }]}>
          <Pressable
            onPress={() => {
              if (messages.length === 0) {
                if (isSheet) handleClose();
                else setMode('hub');
              } else if (isSheet) {
                setMode('hub');
              } else {
                handleClose();
              }
            }}
            hitSlop={12}
          >
            <Text style={styles.back}>{isSheet && messages.length === 0 ? '✕' : '‹'}</Text>
          </Pressable>
          <Text style={styles.hubTitle}>Heimdall</Text>
          <Pressable onPress={clearChat} hitSlop={12}>
            <Text style={styles.clear}>New</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <Text style={styles.emptyHint}>
                Ask Heimdall about merch, cart, orders, or returns.
              </Text>
            }
            ListFooterComponent={
              sending ? (
                <View style={styles.typing}>
                  <AssistantRobotMark size={24} />
                  <ActivityIndicator color={colors.accent} />
                  <Text style={styles.typingText}>Heimdall is thinking…</Text>
                </View>
              ) : null
            }
          />

          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            <TextInput
              style={styles.input}
              placeholder={speech.listening ? 'Listening…' : 'Ask Heimdall…'}
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              editable={!sending}
              multiline
            />
            {voiceEnabled ? (
              <MicButton
                listening={speech.listening}
                disabled={sending}
                onPress={() => {
                  void speech.toggle();
                }}
              />
            ) : null}
            <Pressable
              style={[styles.send, (!input.trim() || sending) && styles.sendDisabled]}
              disabled={!input.trim() || sending}
              onPress={() => void sendText(input)}
            >
              <Text style={styles.sendText}>Send</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </>
    );

  if (isSheet) {
    return <View style={styles.sheetInner}>{body}</View>;
  }

  return (
    <Screen edges={['top']} style={styles.screen}>
      {body}
    </Screen>
  );
}

/** Full-stack route wrapper. */
export function AIAssistantScreen() {
  const route = useRoute();
  const params = (route.params ?? {}) as { mode?: 'talk' | 'chat' };
  return <AIAssistantPanel presentation="screen" initialMode={params.mode} />;
}

/** Home floating widget — circular FAB opens a slide-up chat sheet. */
export function FloatingAIWidget() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  if (!appConfig.features.aiAssistant) return null;

  return (
    <>
      <Pressable
        style={[
          styles.fab,
          { bottom: Math.max(insets.bottom, 12) + 64 },
        ]}
        onPress={() => setOpen(true)}
        accessibilityLabel="Open Heimdall assistant"
      >
        <View style={styles.fabInner}>
          <AssistantRobotMark size={44} />
          <View style={styles.onlineDot} />
        </View>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { height: Math.min(height * 0.88, height - 40) }]}>
            <View style={styles.sheetHandle} />
            <AIAssistantPanel presentation="sheet" onClose={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.text, fontSize: 28, fontWeight: '300', textAlign: 'center', width: 28 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  botBubble: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  bubble: {
    borderRadius: 18,
    maxWidth: 300,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  cardRow: { flexDirection: 'row', gap: 12, marginTop: spacing.lg },
  chatHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  chips: { paddingVertical: spacing.md },
  clear: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: spacing.sm,
  },
  emptyHint: {
    color: colors.textMuted,
    marginTop: 40,
    textAlign: 'center',
  },
  errorBubble: { borderColor: colors.danger },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: 32,
    borderWidth: 2,
    elevation: 8,
    height: 64,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    width: 64,
    zIndex: 20,
  },
  fabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  greet: { color: colors.text, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  greetRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  greetSheet: { fontSize: 22, lineHeight: 28 },
  greetSub: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
  hubContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  hubHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hubTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  listContent: { padding: spacing.md, paddingBottom: spacing.lg },
  metaChip: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modeCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: 20,
    flex: 1,
    padding: spacing.md,
  },
  modeCardWide: { flex: 1 },
  modeIcon: { marginBottom: 12 },
  modeMicOnly: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  modeIconAlt: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 12,
    width: 48,
  },
  modeIconGlyph: { fontSize: 22 },
  modeSub: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  modeTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  msgCol: { flexShrink: 1, maxWidth: '88%' },
  msgRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  msgRowBot: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  onlineDot: {
    backgroundColor: '#22C55E',
    borderColor: colors.surface,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: 'absolute',
    right: -4,
    top: -4,
    width: 14,
  },
  productCard: { marginRight: 10, width: 160 },
  productTrack: { paddingTop: 8 },
  screen: { backgroundColor: colors.background, flex: 1 },
  send: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: colors.onAccent, fontWeight: '800' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 4,
    marginTop: 10,
    width: 40,
  },
  sheetInner: {
    backgroundColor: colors.background,
    flex: 1,
  },
  time: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  typing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  typingText: { color: colors.textMuted, fontSize: 13 },
  userBubble: { backgroundColor: colors.accentSoft },
  userBubbleText: { color: colors.text },
});
