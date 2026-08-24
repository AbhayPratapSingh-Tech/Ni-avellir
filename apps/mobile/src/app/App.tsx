import { Platform, StatusBar } from 'react-native';
import { AppProviders } from './providers/AppProviders';
import { RootNavigator } from './navigation/RootNavigator';

export function App() {
  return (
    <AppProviders>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />
      <RootNavigator />
    </AppProviders>
  );
}
