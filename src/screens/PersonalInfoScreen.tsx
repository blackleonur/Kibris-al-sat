import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiurl from "../Apiurl";
import { RouteProp } from "@react-navigation/native";
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

type PersonalInfoScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PersonalInfo"
>;

type Props = {
  navigation: PersonalInfoScreenNavigationProp;
  route: RouteProp<RootStackParamList, "PersonalInfo">;
};

const PersonalInfoScreen: React.FC<Props> = ({ navigation, route }) => {
  const [email, setEmail] = useState(route.params?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(
    route.params?.phoneNumber ?? ""
  );
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const handleUpdateEmail = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: "GuestHomeScreen" }],
        });
        return;
      }
      const response = await fetch(`${apiurl}/api/users/update-email`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error("E-posta güncellenemedi");
      }
      Alert.alert("Başarılı", "E-posta adresiniz güncellendi");
      setIsEditingEmail(false);
    } catch (error) {
      Alert.alert("Hata", "E-posta güncellenirken bir hata oluştu");
    }
  };

  const handleUpdatePhone = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: "GuestHomeScreen" }],
        });
        return;
      }
      const response = await fetch(`${apiurl}/api/users/update-phone`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });
      if (!response.ok) {
        throw new Error("Telefon numarası güncellenemedi");
      }
      Alert.alert("Başarılı", "Telefon numaranız güncellendi");
      setIsEditingPhone(false);
    } catch (error) {
      Alert.alert("Hata", "Telefon numarası güncellenirken bir hata oluştu");
    }
  };

  return (
    <LinearGradient
      colors={["#8adbd2", "#f5f5f5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.contentModern}>
          <View style={styles.sectionModern}>
            <Text style={styles.sectionTitleModern}>E-posta Adresi</Text>
            <View style={styles.inputContainerModern}>
              {isEditingEmail ? (
                <TextInput
                  style={styles.inputModern}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.valueModern}>{email}</Text>
              )}
              <TouchableOpacity
                style={styles.editButtonModern}
                onPress={() => {
                  if (isEditingEmail) {
                    handleUpdateEmail();
                  } else {
                    setIsEditingEmail(true);
                  }
                }}
              >
                <Text style={styles.editButtonTextModern}>
                  {isEditingEmail ? "Kaydet" : "Düzenle"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionModern}>
            <Text style={styles.sectionTitleModern}>Telefon Numarası</Text>
            <View style={styles.inputContainerModern}>
              {isEditingPhone ? (
                <TextInput
                  style={styles.inputModern}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.valueModern}>{phoneNumber}</Text>
              )}
              <TouchableOpacity
                style={styles.editButtonModern}
                onPress={() => {
                  if (isEditingPhone) {
                    handleUpdatePhone();
                  } else {
                    setIsEditingPhone(true);
                  }
                }}
              >
                <Text style={styles.editButtonTextModern}>
                  {isEditingPhone ? "Kaydet" : "Düzenle"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentModern: {
    padding: 24,
    marginTop: Platform.OS === "ios" ? 48 : 32,
  },
  sectionModern: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitleModern: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  inputContainerModern: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputModern: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    backgroundColor: "#f7f9fc",
  },
  valueModern: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  editButtonModern: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  editButtonTextModern: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default PersonalInfoScreen;
