import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme/tokens';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  visible: boolean;
  onClose: () => void;
};

type ProductLink = {
  id: string;
  label: string;
  title: string;
  q?: string;
  franchise?: string;
  category?: 'collectibles' | 'apparel' | 'desk-gear' | 'limited-drops';
};

type MenuSection = {
  id: string;
  label: string;
  children: ProductLink[];
};

const MENU_RED = '#E10600';

const MENU_SECTIONS: MenuSection[] = [
  {
    id: 'collections',
    label: 'Collections',
    children: [
      { id: 'controllers', label: 'Controllers', q: 'controller', title: 'Controllers' },
      { id: 'computer-it', label: 'Computer & IT', q: 'computer-it', title: 'Computer & IT' },
      { id: 'desk-gear', label: 'Desk gear', category: 'desk-gear', title: 'Desk gear' },
      { id: 'drops', label: 'Limited drops', category: 'limited-drops', title: 'Limited drops' },
    ],
  },
  {
    id: 'fashion',
    label: 'Fashion',
    children: [
      { id: 'fashion-all', label: 'All fashion', category: 'apparel', title: 'Fashion' },
      { id: 'tees', label: 'Tees', q: 'tee', title: 'Tees' },
      { id: 'hoodies', label: 'Hoodies', q: 'hoodie', title: 'Hoodies' },
      { id: 'jerseys', label: 'Jerseys', q: 'jersey', title: 'Jerseys' },
      { id: 'posters', label: 'Posters', q: 'poster', title: 'Posters' },
    ],
  },
  {
    id: 'anime',
    label: 'Anime',
    children: [
      { id: 'anime-all', label: 'All anime', q: 'anime', title: 'Anime' },
      { id: 'solo-leveling', label: 'Solo Leveling', franchise: 'Solo Leveling', title: 'Solo Leveling' },
      { id: 'aot', label: 'Attack on Titan', franchise: 'Attack on Titan', title: 'Attack on Titan' },
      { id: 'demon-slayer', label: 'Demon Slayer', franchise: 'Demon Slayer', title: 'Demon Slayer' },
      { id: 'jjk', label: 'Jujutsu Kaisen', franchise: 'Jujutsu Kaisen', title: 'Jujutsu Kaisen' },
      { id: 'naruto', label: 'Naruto', franchise: 'Naruto', title: 'Naruto' },
      { id: 'one-piece', label: 'One Piece', franchise: 'One Piece', title: 'One Piece' },
      { id: 'dragon-ball', label: 'Dragon Ball', franchise: 'Dragon Ball', title: 'Dragon Ball' },
      { id: 'spy-x-family', label: 'Spy x Family', franchise: 'Spy x Family', title: 'Spy x Family' },
      { id: 'chainsaw-man', label: 'Chainsaw Man', franchise: 'Chainsaw Man', title: 'Chainsaw Man' },
      { id: 'mha', label: 'My Hero Academia', franchise: 'My Hero Academia', title: 'My Hero Academia' },
      { id: 'death-note', label: 'Death Note', franchise: 'Death Note', title: 'Death Note' },
    ],
  },
  {
    id: 'consoles',
    label: 'Consoles',
    children: [
      { id: 'consoles-all', label: 'All consoles', q: 'console', title: 'Consoles' },
      { id: 'ps5', label: 'PlayStation / PS5', q: 'ps5', title: 'PlayStation' },
      { id: 'xbox', label: 'Xbox', q: 'xbox', title: 'Xbox' },
      { id: 'nintendo', label: 'Nintendo', q: 'nintendo', title: 'Nintendo' },
      { id: 'console-controllers', label: 'Controllers', q: 'controller', title: 'Controllers' },
    ],
  },
];

const DRAWER_BG = require('../../../assets/drawer-cod.jpg');

export function ShopDrawer({ visible, onClose }: Props) {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    collections: true,
  });
  const panelWidth = Math.round(width * 0.8);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const goProducts = (params: {
    title: string;
    q?: string;
    franchise?: string;
    category?: 'collectibles' | 'apparel' | 'desk-gear' | 'limited-drops';
  }) => {
    onClose();
    navigation.navigate('Products', params);
  };

  const goInfo = (screen: 'Faq' | 'Returns' | 'Contact' | 'Support') => {
    onClose();
    navigation.navigate(screen);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.panel,
            {
              width: panelWidth,
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        >
          <Image source={DRAWER_BG} style={styles.bgImage} resizeMode="cover" />
          <View style={styles.panelOverlay} pointerEvents="none" />
          <View style={styles.panelContent}>
            <View style={styles.panelHead}>
              <Text style={styles.panelTitle}>Menu</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {MENU_SECTIONS.map((section) => {
                const open = !!openSections[section.id];
                return (
                  <View key={section.id}>
                    <Pressable style={styles.row} onPress={() => toggleSection(section.id)}>
                      <Text style={styles.rowLabel}>{section.label}</Text>
                      <Text style={styles.toggle}>{open ? '−' : '+'}</Text>
                    </Pressable>
                    {open
                      ? section.children.map((item) => (
                          <Pressable
                            key={item.id}
                            style={styles.subRow}
                            onPress={() =>
                              goProducts({
                                title: item.title,
                                ...(item.q ? { q: item.q } : {}),
                                ...(item.franchise ? { franchise: item.franchise } : {}),
                                ...(item.category ? { category: item.category } : {}),
                              })
                            }
                          >
                            <Text style={styles.subLabel}>{item.label}</Text>
                          </Pressable>
                        ))
                      : null}
                  </View>
                );
              })}

              <Pressable style={styles.row} onPress={() => goInfo('Faq')}>
                <Text style={styles.rowLabel}>FAQs</Text>
              </Pressable>
              <Pressable style={styles.row} onPress={() => goInfo('Returns')}>
                <Text style={styles.rowLabel}>Return & exchange</Text>
              </Pressable>
              <Pressable style={styles.row} onPress={() => goInfo('Support')}>
                <Text style={styles.rowLabel}>Support</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  close: {
    color: MENU_RED,
    fontSize: 14,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  panel: {
    backgroundColor: '#0B0D12',
    overflow: 'hidden',
  },
  panelContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    zIndex: 1,
  },
  panelHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  panelTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  row: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.22)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subLabel: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    fontWeight: '600',
  },
  subRow: {
    borderBottomColor: 'rgba(255,255,255,0.14)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingLeft: spacing.md,
    paddingVertical: 12,
  },
  toggle: {
    color: MENU_RED,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
});
