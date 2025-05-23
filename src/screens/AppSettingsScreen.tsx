import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faGlobe,
  faMoon,
  faSun,
  faTrash,
  faChevronLeft,
  faInfoCircle,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { LinearGradient } from "expo-linear-gradient";

const COLORS = {
  primary: "#00A693",
  secondary: "#FF6B6B",
  background: "#F7F9FC",
  surface: "#FFFFFF",
  text: {
    primary: "#1A2138",
    secondary: "#4A5568",
    tertiary: "#A0AEC0",
  },
  border: "#E2E8F0",
  success: "#48BB78",
  warning: "#F6AD55",
  error: "#FC8181",
  shadow: "rgba(26, 33, 56, 0.1)",
};

type AppSettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AppSettings"
>;

type Props = {
  navigation: AppSettingsScreenNavigationProp;
};

const AppSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("tr");
  const [showCacheModal, setShowCacheModal] = useState(false);

  const handleClearCache = () => {
    setShowCacheModal(true);
  };

  return (
    <LinearGradient
      colors={["#8adbd2", "#f5f5f5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.headerModern}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButtonModern}
        >
          <FontAwesomeIcon icon={faChevronLeft} size={22} color="#00A693" />
        </TouchableOpacity>
        <Text style={styles.headerTitleModern}>Uygulama Ayarları</Text>
      </View>
      <View style={styles.contentModern}>
        {/* Dil Seçimi */}
        <View style={styles.settingItemModern}>
          <View style={styles.settingIconModern}>
            <FontAwesomeIcon icon={faGlobe} size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.settingLabelModern}>Dil</Text>
          <TouchableOpacity style={styles.languageButtonModern}>
            <Text style={styles.languageTextModern}>Türkçe</Text>
          </TouchableOpacity>
        </View>
        {/* Tema Seçimi */}
        <View style={styles.settingItemModern}>
          <View style={styles.settingIconModern}>
            <FontAwesomeIcon
              icon={isDarkMode ? faMoon : faSun}
              size={20}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.settingLabelModern}>Tema</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: "#e0e0e0", true: "#c4ede9" }}
            thumbColor={isDarkMode ? COLORS.primary : "#f4f3f4"}
          />
          <Text style={styles.themeTextModern}>
            {isDarkMode ? "Koyu" : "Açık"}
          </Text>
        </View>
        {/* Önbellek Temizleme */}
        <TouchableOpacity
          style={styles.settingItemModern}
          onPress={handleClearCache}
        >
          <View style={styles.settingIconModern}>
            <FontAwesomeIcon icon={faTrash} size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.settingLabelModern}>Önbelleği Temizle</Text>
        </TouchableOpacity>
        {/* Versiyon Bilgisi */}
        <View style={styles.settingItemModern}>
          <View style={styles.settingIconModern}>
            <FontAwesomeIcon
              icon={faInfoCircle}
              size={20}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.settingLabelModern}>Versiyon</Text>
          <Text style={styles.versionTextModern}>1.0.0</Text>
        </View>
      </View>

      {/* Modern Başarı Modalı */}
      <Modal
        visible={showCacheModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCacheModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FontAwesomeIcon
              icon={faCheckCircle}
              size={54}
              color={COLORS.success}
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.modalTitle}>Başarılı!</Text>
            <Text style={styles.modalText}>Önbellek başarıyla temizlendi.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCacheModal(false)}
            >
              <Text style={styles.modalButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerModern: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 48 : 32,
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  backButtonModern: {
    marginRight: 12,
    padding: 8,
    borderRadius: 16,
    backgroundColor: "#e6faf7",
  },
  headerTitleModern: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },
  contentModern: {
    margin: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  settingItemModern: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIconModern: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e6faf7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingLabelModern: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: "500",
    flex: 1,
  },
  languageButtonModern: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  languageTextModern: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  themeTextModern: {
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.text.secondary,
    fontWeight: "bold",
  },
  versionTextModern: {
    color: COLORS.text.secondary,
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 10,
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 32,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.success,
    marginBottom: 8,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 18,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: COLORS.success,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 36,
    marginTop: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default AppSettingsScreen;
