import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getAccessToken } from '../api/auth';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { colors } from '../theme';

const Root = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    getAccessToken().then((token) => setIsLoggedIn(!!token));
  }, []);

  if (isLoggedIn === null) return null; // splash handled in auth stack

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: colors.canvas,
          card: colors.surface,
          text: colors.ink,
          border: colors.border,
          notification: colors.primary,
        },
        fonts: {
          regular: { fontFamily: 'Inter', fontWeight: '400' },
          medium: { fontFamily: 'Inter', fontWeight: '500' },
          bold: { fontFamily: 'Inter', fontWeight: '700' },
          heavy: { fontFamily: 'Inter', fontWeight: '700' },
        },
      }}
    >
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Root.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Root.Screen name="Main" component={MainNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
};
