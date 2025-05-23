import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import apiurl from "../Apiurl";
import { useNavigation } from "@react-navigation/native";
import TokenService from "../services/TokenService";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "RegisterScreen"
>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasUpperCase: false,
    hasSpecialChar: false,
    hasNumber: false,
    hasMinLength: false,
  });

  // Email validasyonu için regex
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Telefon numarası formatı için
  const formatPhoneNumber = (input: string) => {
    const cleaned = input.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(
      6,
      10
    )}`;
  };

  // Phone input handler
  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  // Şifre gereksinimlerini kontrol eden fonksiyon
  const checkPasswordRequirements = (password: string) => {
    setPasswordRequirements({
      hasUpperCase: /[A-Z]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasMinLength: password.length >= 6,
    });
  };

  // Şifre değiştiğinde kontrolleri yap
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    checkPasswordRequirements(text);
  };

  const handleRegister = async () => {
    setError("");

    // Validasyonlar
    if (!validateEmail(email)) {
      setError("Geçerli bir e-posta adresi giriniz.");
      return;
    }

    if (phone.replace(/\D/g, "").length !== 10) {
      setError("Telefon numarası 10 haneli olmalıdır.");
      return;
    }

    if (
      !passwordRequirements.hasUpperCase ||
      !passwordRequirements.hasSpecialChar ||
      !passwordRequirements.hasNumber ||
      !passwordRequirements.hasMinLength
    ) {
      setError("Şifre gereksinimleri karşılanmıyor.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor!");
      return;
    }

    if (!name.trim()) {
      setError("İsim alanı boş bırakılamaz.");
      return;
    }

    try {
      const response = await fetch(`${apiurl}/api/auth/start-register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName: name,
          phoneNumber: phone.replace(/\D/g, ""),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.message?.includes("Kod gönderildi")) {
        navigation.navigate("VerificationScreen", {
          userData: {
            fullName: name,
            email,
            phoneNumber: phone.replace(/\D/g, ""),
            password,
          },
          expiresIn: 180,
        });
      } else {
        setError(data.message || "Bir hata oluştu.");
      }
    } catch (err) {
      setError("Sunucuya bağlanılamadı.");
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${apiurl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Token'ı kaydet
        if (data.token) {
          console.log("Alınan Token:", data.token);
          console.log(
            "Decode edilmiş token:",
            TokenService.decodeToken(data.token)
          );

          await TokenService.setToken(data.token);
          // Başarılı giriş durumunda ana sayfaya yönlendir
          navigation.replace("Home");
        } else {
          setError("Token alınamadı. Lütfen tekrar deneyin.");
        }
      } else {
        // Hata durumunda kullanıcıya bilgi ver
        setError(
          data.message ||
            "Giriş başarısız oldu. Lütfen bilgilerinizi kontrol edin."
        );
      }
    } catch (error) {
      console.error("Login hatası:", error);
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  // Şifre gereksinimlerini gösteren bileşen
  const PasswordRequirements = () => (
    <View style={styles.requirementsContainer}>
      <View style={styles.requirementsRow}>
        <View style={styles.requirementItem}>
          <FontAwesomeIcon
            icon={passwordRequirements.hasUpperCase ? faCheck : faTimes}
            size={12}
            color={passwordRequirements.hasUpperCase ? "#48BB78" : "#FC8181"}
          />
          <Text
            style={[
              styles.requirementText,
              passwordRequirements.hasUpperCase && styles.requirementMet,
            ]}
          >
            Büyük harf
          </Text>
        </View>
        <View style={styles.requirementItem}>
          <FontAwesomeIcon
            icon={passwordRequirements.hasSpecialChar ? faCheck : faTimes}
            size={12}
            color={passwordRequirements.hasSpecialChar ? "#48BB78" : "#FC8181"}
          />
          <Text
            style={[
              styles.requirementText,
              passwordRequirements.hasSpecialChar && styles.requirementMet,
            ]}
          >
            Özel karakter
          </Text>
        </View>
      </View>
      <View style={styles.requirementsRow}>
        <View style={styles.requirementItem}>
          <FontAwesomeIcon
            icon={passwordRequirements.hasNumber ? faCheck : faTimes}
            size={12}
            color={passwordRequirements.hasNumber ? "#48BB78" : "#FC8181"}
          />
          <Text
            style={[
              styles.requirementText,
              passwordRequirements.hasNumber && styles.requirementMet,
            ]}
          >
            Rakam
          </Text>
        </View>
        <View style={styles.requirementItem}>
          <FontAwesomeIcon
            icon={passwordRequirements.hasMinLength ? faCheck : faTimes}
            size={12}
            color={passwordRequirements.hasMinLength ? "#48BB78" : "#FC8181"}
          />
          <Text
            style={[
              styles.requirementText,
              passwordRequirements.hasMinLength && styles.requirementMet,
            ]}
          >
            6+ karakter
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={["#8adbd2", "#f5f5f5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>
                {activeTab === "register" ? "Hesap Oluştur" : "Giriş Yap"}
              </Text>
              <Text style={styles.subtitle}>
                {activeTab === "register"
                  ? "İkinci el alışverişin en güvenli adresi"
                  : "Hesabınıza giriş yapın"}
              </Text>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "register" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("register")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "register" && styles.activeTabText,
                  ]}
                >
                  Kayıt Ol
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "login" && styles.activeTab]}
                onPress={() => setActiveTab("login")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "login" && styles.activeTabText,
                  ]}
                >
                  Giriş Yap
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {activeTab === "register" && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Ad Soyad"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    placeholderTextColor="#666"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="E-posta"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#666"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="0(___) ___ ____"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="numeric"
                    maxLength={14}
                    placeholderTextColor="#666"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Şifre (en az 6 karakter)"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry
                    placeholderTextColor="#666"
                  />
                  <PasswordRequirements />
                  <TextInput
                    style={styles.input}
                    placeholder="Şifre Tekrar"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholderTextColor="#666"
                  />
                </>
              )}

              {activeTab === "login" && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="E-posta"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#666"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Şifre"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#666"
                  />
                </>
              )}

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={styles.button}
                onPress={
                  activeTab === "register" ? handleRegister : handleLogin
                }
              >
                <Text style={styles.buttonText}>
                  {activeTab === "register" ? "Kayıt Ol" : "Giriş Yap"}
                </Text>
              </TouchableOpacity>

              {activeTab === "login" && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a2138",
    marginBottom: 10,
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#4A5568",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#278f9d",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4A5568",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 15,
    color: "#1a2138",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: "#8adbd2",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#8adbd2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 20,
  },
  forgotPasswordText: {
    color: "#1a2138",
    fontSize: 15,
    fontWeight: "500",
  },
  errorText: {
    color: "#FC8181",
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  requirementsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  requirementsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  requirementText: {
    fontSize: 11,
    color: "#FC8181",
    marginLeft: 4,
  },
  requirementMet: {
    color: "#48BB78",
  },
});

export default RegisterScreen;
