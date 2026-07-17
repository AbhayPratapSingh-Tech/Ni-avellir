import { StatusBar } from 'react-native';
import { AppProviders } from './providers/AppProviders';
import { HomeScreen } from '../features/home/HomeScreen';
import { colors } from '../theme/tokens';

export function App() {
  return (
    <AppProviders>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <HomeScreen />
    </AppProviders>
  );
}
