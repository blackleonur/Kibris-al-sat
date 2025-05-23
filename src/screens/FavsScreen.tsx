import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiurl from "../Apiurl";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
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

type FavsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Favs"
>;

type Props = {
  navigation: FavsScreenNavigationProp;
};

type Ad = {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  status: string;
  categoryName: string;
};

const FavsScreen: React.FC<Props> = ({ navigation }) => {
  const [favorites, setFavorites] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: "GuestHomeScreen" }],
        });
        return;
      }
      const response = await fetch(`${apiurl}/api/favorites`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Favoriler alınamadı");
      }
      const data = await response.json();
      setFavorites(data.$values || data || []);
    } catch (error) {
      Alert.alert("Hata", "Favoriler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (adId: number) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const response = await fetch(`${apiurl}/api/favorites/remove/${adId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Favori kaldırılamadı");
      }
      setFavorites(favorites.filter((fav) => fav.id !== adId));
      Alert.alert("Başarılı", "İlan favorilerden kaldırıldı");
    } catch (error) {
      Alert.alert("Hata", "Favori kaldırılırken bir hata oluştu");
    }
  };

  const renderItem = ({ item }: { item: Ad }) => (
    <View style={styles.advertItem}>
      <TouchableOpacity
        style={styles.advertImageContainer}
        onPress={() => navigation.navigate("Advert", { advertId: item.id })}
      >
        <Image
          source={{ uri: item.imageUrl || "https://via.placeholder.com/150" }}
          style={styles.advertImage}
        />
      </TouchableOpacity>
      <View style={styles.advertInfo}>
        <Text style={styles.advertTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.advertPrice}>
          {item.price.toLocaleString("tr-TR")} ₺
        </Text>
        <Text style={styles.advertCategory}>{item.categoryName}</Text>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => removeFavorite(item.id)}
      >
        <FontAwesomeIcon
          icon={faHeartSolid}
          size={22}
          color={COLORS.secondary}
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesomeIcon
            icon={faHeartRegular}
            size={48}
            color={COLORS.secondary}
          />
          <Text style={styles.emptyText}>Henüz favoriniz bulunmuyor</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 15,
    paddingBottom: 40,
  },
  advertItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 8,
    marginVertical: 8,
    padding: 14,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 110,
  },
  advertImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  advertImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  advertInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  advertTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  advertPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4,
  },
  advertCategory: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  favoriteButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#fbeaec",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.text.secondary,
    marginTop: 18,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default FavsScreen;
