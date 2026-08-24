import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { useAppDispatch } from '../../app/store';
import { enterGuest } from './authSlice';
import type { AuthStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<AuthStackParamList>;

const APP_NAME = 'Niðavellir';
const AUTO_ADVANCE_MS = 4000;

const slides = [
  {
    id: '1',
    title: `Welcome to ${APP_NAME}`,
    body: 'Dive into a world of forged collectibles and match-day gear. Discover limited drops and unleash the gamer in you.',
    image:
      'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=1400&q=80',
    overlay: 'rgba(48, 16, 80, 0.62)',
  },
  {
    id: '2',
    title: 'Explore the latest drops',
    body: 'Browse controllers, headsets, jerseys, and desk kits — from numbered runs to everyday forge staples.',
    image:
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1400&q=80',
    overlay: 'rgba(28, 18, 56, 0.62)',
  },
  {
    id: '3',
    title: 'Seamless shopping',
    body: 'Find the right kit, lock the cart, and gear up for the next session. Start exploring the forge now.',
    image:
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1400&q=80',
    overlay: 'rgba(8, 18, 48, 0.68)',
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<(typeof slides)[number]>>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!focused) return;
    const timer = setTimeout(() => {
      const next = (index + 1) % slides.length;
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
      setIndex(next);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [focused, index, width]);

  const goLogin = () => navigation.navigate('Login');
  const goGuest = () => dispatch(enterGuest());

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1)))
        }
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <Image source={{ uri: item.image }} style={styles.photo} resizeMode="cover" />
            <View style={[styles.overlay, { backgroundColor: item.overlay }]} />
            <View style={[styles.copy, { paddingTop: insets.top + 56 }]}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      <Pressable style={[styles.skip, { top: insets.top + 12 }]} onPress={goGuest}>
        <Text style={styles.skipText}>Skip ›</Text>
      </Pressable>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <View key={slide.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          onPress={goLogin}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          {({ pressed }) => (
            <Text style={[styles.ctaText, pressed && styles.ctaTextPressed]}>Login / Signup</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 320,
  },
  copy: {
    paddingHorizontal: 24,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
  },
  ctaPressed: {
    backgroundColor: colors.accent,
  },
  ctaText: {
    color: '#111318',
    fontSize: 16,
    fontWeight: '800',
  },
  ctaTextPressed: {
    color: '#FFFFFF',
  },
  dot: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 22,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  footer: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    position: 'absolute',
    right: 0,
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  photo: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  screen: {
    backgroundColor: '#07080C',
    flex: 1,
  },
  skip: {
    position: 'absolute',
    right: 20,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
  },
});
