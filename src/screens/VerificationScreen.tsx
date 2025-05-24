import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Animated,
  Easing,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import apiurl from "../Apiurl";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

type VerificationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "VerificationScreen"
>;

type VerificationScreenRouteProp = RouteProp<
  RootStackParamList,
  "VerificationScreen"
>;

type Props = {
  navigation: VerificationScreenNavigationProp;
};

const VerificationScreen: React.FC<Props> = ({ navigation }) => {
  const route = useRoute<VerificationScreenRouteProp>();
  const { userData } = route.params;
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [timer, setTimer] = useState(180);
  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });
  const [successModal, setSuccessModal] = useState({
    visible: false,
    message: "",
  });

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Kod girişi değiştiğinde
  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Otomatik olarak bir sonraki input'a geç
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Backspace tuşuna basıldığında önceki input'a geç
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Doğrulama kodunu kontrol et ve kayıt işlemini gerçekleştir
  const verifyCode = async () => {
    const enteredCode = code.join("");

    if (enteredCode.length !== 6) {
      setErrorModal({
        visible: true,
        message: "Lütfen 6 haneli doğrulama kodunu giriniz.",
      });
      return;
    }

    try {
      // Önce kodu doğrula
      const verifyRes = await fetch(`${apiurl}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userData.email, code: enteredCode }),
      });
      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData === true) {
        // Kod doğruysa register isteği at
        const requestData = {
          fullName: userData.fullName,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          password: userData.password,
        };
        const response = await fetch(`${apiurl}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });
        const data = await response.json();
        if (response.ok) {
          setShowWelcomeModal(true);
          Animated.timing(progressAnimation, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: false,
          }).start();
          setTimeout(() => {
            setShowWelcomeModal(false);
            navigation.reset({
              index: 0,
              routes: [
                { name: "RegisterScreen", params: { fromVerification: true } },
              ],
            });
          }, 3000);
        } else {
          setErrorModal({
            visible: true,
            message: data.message || "Kayıt başarısız.",
          });
        }
      } else {
        setErrorModal({
          visible: true,
          message: "Kod yanlış veya süresi doldu.",
        });
      }
    } catch (error) {
      setErrorModal({
        visible: true,
        message: "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  // Yeni kod gönder
  const resendCode = async () => {
    const enteredCode = code.join("");
    if (enteredCode.length !== 6) {
      setErrorModal({
        visible: true,
        message: "Lütfen 6 haneli doğrulama kodunu giriniz.",
      });
      return;
    }
    try {
      const response = await fetch(`${apiurl}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          code: enteredCode,
        }),
      });
      const data = await response.json();
      setTimer(180); // veya test için 8
      if (response.ok && data === true) {
        setSuccessModal({
          visible: true,
          message: "Kod doğrulandı, kayıt işlemi devam ediyor.",
        });
        // Burada istersen kayıt işlemini başlatabilirsin
      } else {
        setErrorModal({
          visible: true,
          message: "Kod yanlış veya süresi doldu.",
        });
      }
    } catch (error) {
      setErrorModal({
        visible: true,
        message: "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Doğrulama Kodu</Text>
            <Text style={styles.subtitle}>
              Mail adresinize gönderilen 6 haneli doğrulama kodunu giriniz.
            </Text>
          </View>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.codeInput}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <Text
            style={{ textAlign: "center", marginVertical: 8, color: "#888" }}
          >
            Kalan süre: {timer} sn
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={verifyCode}
            disabled={timer <= 0}
          >
            <Text style={styles.buttonText}>Doğrula</Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Kod almadınız mı?</Text>
            <TouchableOpacity onPress={resendCode} disabled={timer > 0}>
              <Text
                style={[styles.resendButton, timer > 0 && { color: "#bbb" }]}
              >
                Yeniden Gönder
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Hata Modalı */}
      <Modal visible={errorModal.visible} transparent animationType="fade">
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContainer}>
            <Text style={styles.errorModalTitle}>Hata</Text>
            <Text style={styles.errorModalMessage}>{errorModal.message}</Text>
            <TouchableOpacity
              style={styles.errorModalButton}
              onPress={() => setErrorModal({ visible: false, message: "" })}
            >
              <Text style={styles.errorModalButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hoş Geldiniz Modalı */}
      <Modal visible={showWelcomeModal} transparent={true} animationType="fade">
        <View style={styles.welcomeModalOverlay}>
          <View style={styles.welcomeModalContainer}>
            <View style={styles.welcomeIconContainer}>
              <Text style={styles.welcomeIcon}>🎉</Text>
            </View>
            <Text style={styles.welcomeTitle}>Hoş Geldiniz!</Text>
            <Text style={styles.welcomeMessage}>
              Kıbrıs Al Sat'a hoş geldiniz.Giriş yaptıktan sonra alım satım
              yapabilir, mesajlaşabilir ve daha fazlasını yapabilirsiniz.
            </Text>
            <View style={styles.welcomeProgressBar}>
              <Animated.View
                style={[styles.welcomeProgressFill, { width: progressWidth }]}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Başarı Modalı */}
      <Modal visible={successModal.visible} transparent animationType="fade">
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContainer}>
            <Text style={styles.successModalTitle}>Başarılı</Text>
            <Text style={styles.successModalMessage}>
              {successModal.message}
            </Text>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => setSuccessModal({ visible: false, message: "" })}
            >
              <Text style={styles.successModalButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 24,
    fontWeight: "bold",
    backgroundColor: "#f5f5f5",
  },
  button: {
    backgroundColor: "#8adbd2",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: "#666",
  },
  resendButton: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8adbd2",
    marginLeft: 5,
  },
  // Hoş Geldiniz Modal Stilleri
  welcomeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  welcomeModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    width: "90%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f7ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeIcon: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  welcomeMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  welcomeProgressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  welcomeProgressFill: {
    height: "100%",
    backgroundColor: "#8adbd2",
    borderRadius: 3,
  },
  // Hata Modalı
  errorModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
    width: "90%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FC8181",
    marginBottom: 10,
    textAlign: "center",
  },
  errorModalMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 18,
  },
  errorModalButton: {
    backgroundColor: "#8adbd2",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
    alignSelf: "center",
  },
  errorModalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Success modal stilleri
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
    width: "90%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#48BB78",
    marginBottom: 10,
    textAlign: "center",
  },
  successModalMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 18,
  },
  successModalButton: {
    backgroundColor: "#8adbd2",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
    alignSelf: "center",
  },
  successModalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default VerificationScreen;
