import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faLock,
  faEye,
  faFingerprint,
  faShieldAlt,
  faKey,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";

type PrivacyScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Privacy"
>;

type Props = {
  navigation: PrivacyScreenNavigationProp;
};

const PrivacyScreen: React.FC<Props> = ({ navigation }) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [locationPrivacy, setLocationPrivacy] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);

  const handlePasswordChange = () => {
    Alert.alert(
      "Şifre Değiştir",
      "Şifrenizi değiştirmek için e-posta adresinize bir bağlantı göndereceğiz.",
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Gönder",
          onPress: () => {
            // Şifre değiştirme e-postası gönderme işlemi
            Alert.alert(
              "Başarılı",
              "Şifre değiştirme bağlantısı e-posta adresinize gönderildi."
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesap Güvenliği</Text>

        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <FontAwesomeIcon icon={faLock} size={20} color="#8adbd2" />
            <Text style={styles.menuItemText}>İki Faktörlü Doğrulama</Text>
          </View>
          <Switch
            value={twoFactorEnabled}
            onValueChange={setTwoFactorEnabled}
            trackColor={{ false: "#e0e0e0", true: "#c4ede9" }}
            thumbColor={twoFactorEnabled ? "#8adbd2" : "#f4f3f4"}
          />
        </View>

        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <FontAwesomeIcon icon={faFingerprint} size={20} color="#8adbd2" />
            <Text style={styles.menuItemText}>Parmak İzi ile Giriş</Text>
          </View>
          <Switch
            value={fingerprintEnabled}
            onValueChange={setFingerprintEnabled}
            trackColor={{ false: "#e0e0e0", true: "#c4ede9" }}
            thumbColor={fingerprintEnabled ? "#8adbd2" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handlePasswordChange}
        >
          <View style={styles.menuItemLeft}>
            <FontAwesomeIcon icon={faKey} size={20} color="#8adbd2" />
            <Text style={styles.menuItemText}>Şifre Değiştir</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gizlilik</Text>

        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <FontAwesomeIcon icon={faEye} size={20} color="#8adbd2" />
            <Text style={styles.menuItemText}>Profil Görünürlüğü</Text>
          </View>
          <Switch
            value={profileVisibility}
            onValueChange={setProfileVisibility}
            trackColor={{ false: "#e0e0e0", true: "#c4ede9" }}
            thumbColor={profileVisibility ? "#8adbd2" : "#f4f3f4"}
          />
        </View>

        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <FontAwesomeIcon icon={faShieldAlt} size={20} color="#8adbd2" />
            <Text style={styles.menuItemText}>Konum Gizliliği</Text>
          </View>
          <Switch
            value={locationPrivacy}
            onValueChange={setLocationPrivacy}
            trackColor={{ false: "#e0e0e0", true: "#c4ede9" }}
            thumbColor={locationPrivacy ? "#8adbd2" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <FontAwesomeIcon icon={faHistory} size={20} color="#8adbd2" />
            <Text style={styles.menuItemText}>Hesap Aktivitesi</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Gizlilik ve güvenlik ayarlarınızı düzenleyerek hesabınızı daha güvenli
          hale getirebilirsiniz. İki faktörlü doğrulama ve parmak izi ile giriş
          özelliklerini aktif ederek ek güvenlik katmanları ekleyebilirsiniz.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  infoContainer: {
    margin: 15,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

export default PrivacyScreen;
