import React, { useEffect, useRef } from "react";
import { View, Text, Image, StyleSheet, Animated, Easing } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import apiurl from "../Apiurl";
import { LinearGradient } from "expo-linear-gradient";

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SplashScreen"
>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;

  // Baloncukları oluşturmak için yardımcı fonksiyon
  const generateBubbles = () => {
    const bubbles = [];
    const bubbleCount = 1000; // Baloncuk sayısı

    for (let i = 0; i < bubbleCount; i++) {
      const size = Math.random() * 3 + 1; // 1px ile 4px arası
      const top = Math.random() * 100; // 0% ile 100% arası
      const left = Math.random() * 100; // 0% ile 100% arası

      bubbles.push(
        <Animated.View
          key={`bubble-${i}`}
          style={[
            styles.decorativeCircle,
            {
              width: size,
              height: size,
              top: `${top}%`,
              left: `${left}%`,
              opacity: circleOpacity,
              transform: [{ scale: circleScale }],
            },
          ]}
        />
      );
    }
    return bubbles;
  };

  useEffect(() => {
    // Logo için basit animasyon
    Animated.sequence([
      // Önce daire animasyonu
      Animated.parallel([
        Animated.spring(circleScale, {
          toValue: 1,
          tension: 10,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(circleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Sonra logo animasyonu
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 10,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Slogan için silme efekti animasyonu
    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Tüm animasyonlar bittikten sonra 2 saniye bekle ve RegisterScreen'e yönlendir
      setTimeout(() => {
        navigation.replace("RegisterScreen");
      }, 2000);
    });
  }, [
    logoScale,
    logoOpacity,
    fadeAnim,
    circleScale,
    circleOpacity,
    navigation,
  ]);

  return (
    <LinearGradient
      colors={["#8adbd2", "#f5f5f5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        {/* Dekoratif daireler */}
        {generateBubbles()}

        {/* Logo container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require("../../assets/kıbrıslogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sloganContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.slogan}>
            Almanın da Satmanın da En Kolay Yolu!
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    zIndex: 2,
  },
  logo: {
    width: 200,
    height: 200,
  },
  sloganContainer: {
    position: "absolute",
    bottom: 50,
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  slogan: {
    fontSize: 22,
    color: "#278f9d",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 30,
    letterSpacing: 0.5,
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  decorativeCircle: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: "#8adbd2",
    opacity: 0.015,
  },
});

export default SplashScreen;
