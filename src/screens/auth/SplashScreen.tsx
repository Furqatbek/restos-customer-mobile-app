import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'Splash'> };

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const scale = new Animated.Value(0.85);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Onboarding'), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={['#2D0A0A', '#8B1A1A', '#C9963C']} style={styles.container}>
      <Animated.View style={[styles.center, { transform: [{ scale }], opacity }]}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={styles.poweredBy}>
        <Text variant="caption" color="rgba(255,255,255,0.3)" align="center">Powered by RestOS</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  logo: { width: 280, height: 280 },
  poweredBy: { position: 'absolute', bottom: 48 },
});
