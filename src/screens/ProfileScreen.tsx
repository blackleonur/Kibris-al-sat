import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Switch,
  Alert,
  Platform,
  Modal,
  TextInput,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faUser,
  faHeart,
  faShoppingBag,
  faCog,
  faQuestionCircle,
  faSignOutAlt,
  faChevronRight,
  faBell,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import apiurl from "../Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

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

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Profile"
>;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

type Ad = {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  status: string;
  categoryName: string;
};

type User = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
};

type UserData = {
  user: User;
  myAds: {
    $values: Ad[];
  };
  favorites?: {
    $values: Ad[];
  };
};

// MODAL ICON BİLEŞENİ
const ModalIcon = ({ icon, color }: { icon: any; color: string }) => (
  <View
    style={{
      backgroundColor: color + "22",
      borderRadius: 50,
      width: 64,
      height: 64,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      marginBottom: 12,
    }}
  >
    <FontAwesomeIcon icon={icon} size={32} color={color} />
  </View>
);

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Ad[]>([]);

  // Yeni state'ler
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: "GuestHomeScreen" }],
        });
        return;
      }
      const response = await fetch(`${apiurl}/api/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(
          `Kullanıcı bilgileri alınamadı. Status: ${response.status}`
        );
      }
      const data = await response.json();
      setUserData(data);
    } catch (error: any) {
      Alert.alert(
        "Hata",
        `Kullanıcı bilgileri yüklenirken bir hata oluştu: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    navigation.reset({
      index: 0,
      routes: [{ name: "GuestHomeScreen" }],
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#8adbd2", "#f5f5f5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={{ flex: 1, marginTop: Platform.OS === "ios" ? 48 : 32 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profil Başlığı */}
          <View style={styles.headerModern}>
            <Text style={styles.userNameModern}>
              {userData?.user.fullName || "İsimsiz Kullanıcı"}
            </Text>
          </View>

          {/* İstatistikler */}
          <View style={styles.statsContainerModern}>
            <View style={styles.statItemModern}>
              <Text style={styles.statNumberModern}>
                {userData?.myAds.$values.length || "0"}
              </Text>
              <Text style={styles.statLabelModern}>İlanlarım</Text>
            </View>
            <View style={styles.statDividerModern} />
            <View style={styles.statItemModern}>
              <Text style={styles.statNumberModern}>0</Text>
              <Text style={styles.statLabelModern}>Favoriler</Text>
            </View>
            <View style={styles.statDividerModern} />
            <View style={styles.statItemModern}>
              <Text style={styles.statNumberModern}>
                {userData?.myAds.$values.filter((ad) => ad.status === "Satıldı")
                  .length || "0"}
              </Text>
              <Text style={styles.statLabelModern}>Satışlar</Text>
            </View>
          </View>

          {/* Menü Bölümü */}
          <View style={styles.menuSectionModern}>
            <Text style={styles.menuSectionTitleModern}>Hesabım</Text>
            <TouchableOpacity
              style={styles.menuItemModern}
              onPress={() =>
                navigation.navigate("PersonalInfo", {
                  email: userData?.user.email ?? "",
                  phoneNumber: userData?.user.phoneNumber ?? "",
                })
              }
            >
              <View style={styles.menuItemLeftModern}>
                <FontAwesomeIcon
                  icon={faUser}
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.menuItemTextModern}>
                  Kişisel Bilgilerim
                </Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} size={16} color="#ccc" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuSectionModern}>
            <Text style={styles.menuSectionTitleModern}>Ayarlar</Text>
            <View style={styles.menuItemModern}>
              <View style={styles.menuItemLeftModern}>
                <FontAwesomeIcon
                  icon={faBell}
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.menuItemTextModern}>Bildirimler</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#e0e0e0", true: "#c4ede9" }}
                thumbColor={notificationsEnabled ? COLORS.primary : "#f4f3f4"}
              />
            </View>
            <TouchableOpacity
              style={styles.menuItemModern}
              onPress={() => navigation.navigate("AppSettings")}
            >
              <View style={styles.menuItemLeftModern}>
                <FontAwesomeIcon
                  icon={faCog}
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.menuItemTextModern}>Uygulama Ayarları</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} size={16} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItemModern}
              onPress={() => navigation.navigate("Privacy")}
            >
              <View style={styles.menuItemLeftModern}>
                <FontAwesomeIcon
                  icon={faShieldAlt}
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.menuItemTextModern}>
                  Gizlilik ve Güvenlik
                </Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} size={16} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItemModern}
              onPress={() => navigation.navigate("Help")}
            >
              <View style={styles.menuItemLeftModern}>
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.menuItemTextModern}>Yardım ve Destek</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} size={16} color="#ccc" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutButtonModern}
            onPress={handleLogout}
          >
            <FontAwesomeIcon
              icon={faSignOutAlt}
              size={20}
              color={COLORS.secondary}
            />
            <Text style={styles.logoutButtonTextModern}>Çıkış Yap</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Çıkış Onay Modalı */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <BlurView intensity={60} tint="light" style={styles.modalOverlay}>
          <View style={styles.modalContentModern}>
            <ModalIcon icon={faSignOutAlt} color={COLORS.secondary} />
            <Text
              style={[styles.modalTitleModern, { color: COLORS.secondary }]}
            >
              Çıkış Yap
            </Text>
            <Text style={styles.modalTextModern}>
              Çıkış yapmak istediğinize emin misiniz?
            </Text>
            <View style={styles.modalButtonsModern}>
              <TouchableOpacity
                style={[styles.modalButtonModern, styles.cancelButtonModern]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonTextModern}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonModern, styles.confirmButtonModern]}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonTextModern}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerModern: {
    backgroundColor: "#fff",
    padding: 28,
    alignItems: "center",
    borderBottomWidth: 0,
    borderRadius: 24,
    margin: 18,
    marginBottom: 0,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  userNameModern: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  editProfileButtonModern: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  editProfileButtonTextModern: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  statsContainerModern: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 18,
    marginBottom: 18,
    paddingVertical: 18,
    borderRadius: 18,
    marginHorizontal: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statItemModern: {
    flex: 1,
    alignItems: "center",
  },
  statNumberModern: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 5,
  },
  statLabelModern: {
    fontSize: 15,
    color: COLORS.text.secondary,
  },
  statDividerModern: {
    width: 1,
    height: "70%",
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  menuSectionModern: {
    backgroundColor: "#fff",
    marginBottom: 18,
    paddingTop: 12,
    paddingBottom: 8,
    borderRadius: 18,
    marginHorizontal: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  menuSectionTitleModern: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: 10,
    paddingHorizontal: 18,
  },
  menuItemModern: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeftModern: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemTextModern: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 15,
    fontWeight: "500",
  },
  logoutButtonModern: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginBottom: 30,
    marginTop: 10,
    padding: 16,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoutButtonTextModern: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentModern: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    width: "88%",
    alignSelf: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitleModern: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  modalTextModern: {
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 24,
    marginBottom: 18,
    textAlign: "center",
  },
  closeButtonModern: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
    alignSelf: "center",
  },
  closeButtonTextModern: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalButtonsModern: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  modalButtonModern: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: "center",
  },
  cancelButtonModern: {
    backgroundColor: "#f5f5f5",
  },
  confirmButtonModern: {
    backgroundColor: COLORS.secondary,
  },
  cancelButtonTextModern: {
    color: COLORS.text.secondary,
    fontWeight: "bold",
    fontSize: 16,
  },
  confirmButtonTextModern: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ProfileScreen;
