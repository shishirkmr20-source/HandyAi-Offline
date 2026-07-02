/**
 * AppNavigator — bottom-tab navigation.
 *
 * Tabs: Chat · History · Models · Settings
 *
 * The Chat tab is the entry point and shows the active conversation.
 */
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useColorScheme } from 'react-native';

import { ChatScreen } from '../screens/ChatScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ModelsScreen } from '../screens/ModelsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Chat: undefined;
  History: undefined;
  Models: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <Icon name={name} size={size} color={color} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '600' as const },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <TabIcon name="chat-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <TabIcon name="history" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Models"
        component={ModelsScreen}
        options={{
          title: 'Models',
          tabBarIcon: ({ color, size }) => <TabIcon name="package-variant-closed" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <TabIcon name="cog-outline" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();

  const useDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme !== 'light');

  const navTheme = {
    ...(useDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(useDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
      notification: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
