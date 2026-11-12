import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppStackParamList, AuthStackParamList } from './navigationTypes';
import { HomeScreen } from './screens/HomeScreen';
import { LecturerFormScreen } from './screens/LecturerFormScreen';
import { SignInScreen } from './screens/SignInScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { palette } from './theme/tokens';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const TasteNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.bg,
    card: palette.bg,
    text: palette.ink,
    border: palette.hairline,
    primary: palette.accent,
  },
};

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={TasteNavTheme}>
      {user ? (
        <AppStack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: palette.bg },
            headerTintColor: palette.ink,
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '600', fontSize: 17 },
            headerBackTitle: 'Back',
            contentStyle: { backgroundColor: palette.bg },
          }}
        >
          <AppStack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <AppStack.Screen
            name="LecturerForm"
            component={LecturerFormScreen}
            options={{ title: 'Lecturer' }}
          />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.bg },
          }}
        >
          <AuthStack.Screen name="SignIn" component={SignInScreen} />
          <AuthStack.Screen name="SignUp" component={SignUpScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.bg,
  },
});
