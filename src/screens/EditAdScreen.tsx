import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../Types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiurl from "../Apiurl";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faChevronRight,
  faChevronLeft,
  faFireAlt,
} from "@fortawesome/free-solid-svg-icons";

type EditAdScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditAd"
>;
type EditAdScreenRouteProp = RouteProp<RootStackParamList, "EditAd">;

type Props = {
  navigation: EditAdScreenNavigationProp;
  route: EditAdScreenRouteProp;
};

type AdDetails = {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  address: string;
  categoryId: number;
  userId: string;
  status: string;
  latitude: number;
  longitude: number;
  categoryName: string;
  images: { url: string }[];
};

const EditAdScreen: React.FC<Props> = ({ navigation, route }) => {
  const { adId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adDetails, setAdDetails] = useState<AdDetails | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchAdDetails();
  }, []);

  const fetchAdDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.navigate("RegisterScreen");
        return;
      }

      const response = await fetch(`${apiurl}/api/ad-listings/${adId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("İlan detayları alınamadı");
      }

      const data = await response.json();
      const images = data.imageUrls?.$values || [];
      setAdDetails({ ...data, images: images.map((url: string) => ({ url })) });
      setTitle(data.title);
      setDescription(data.description);
      setPrice(data.price.toString());
    } catch (error) {
      Alert.alert("Hata", "İlan detayları yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!adDetails) return;

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert(
          "Hata",
          "Kullanıcı token'ı bulunamadı. Lütfen tekrar giriş yapın."
        );
        navigation.navigate("RegisterScreen");
        return;
      }

      const updatedAd = {
        id: adDetails.id,
        title,
        description,
        price: parseInt(price, 10),
        imageUrl: adDetails.imageUrl || "https://defaultimage.com/default.png",
        address: adDetails.address,
        categoryId: adDetails.categoryId,
        userId: adDetails.userId,
        status: adDetails.status,
        latitude: adDetails.latitude,
        longitude: adDetails.longitude,
        images: adDetails.images.map((image, index) => ({
          id: index,
          url: image.url,
          adListingId: adDetails.id,
          adListing: "AdListing",
        })),
      };

      console.log("Gönderilen Veri:", updatedAd);

      const response = await fetch(`${apiurl}/api/ad-listings/${adId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedAd),
      });

      console.log("Sunucu Yanıtı:", response);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Hata Detayları:", errorData);
        throw new Error(errorData.message || "İlan güncellenemedi");
      }

      Alert.alert("Başarılı", "İlan başarıyla güncellendi", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const err = error as Error;
      Alert.alert(
        "Hata",
        `İlan güncellenirken bir hata oluştu: ${err.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageSwipe = (direction: "left" | "right") => {
    if (adDetails?.images) {
      const maxIndex = adDetails.images.length - 1;
      if (direction === "left") {
        setCurrentImageIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
      } else {
        setCurrentImageIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8adbd2" />
      </View>
    );
  }

  if (!adDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text>İlan bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {adDetails?.images && adDetails.images.length > 0 ? (
          <>
            <TouchableOpacity
              style={styles.imageSwipeLeft}
              onPress={() => handleImageSwipe("left")}
            >
              <FontAwesomeIcon icon={faChevronRight} size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageSwipeRight}
              onPress={() => handleImageSwipe("right")}
            >
              <FontAwesomeIcon icon={faChevronLeft} size={20} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri: adDetails.images[currentImageIndex].url }}
              style={styles.adImage}
              resizeMode="cover"
            />
          </>
        ) : (
          <View style={styles.noImageContainer}>
            <Text>Resim bulunamadı</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.editPhotosButton}
          onPress={() => {
            Alert.alert(
              "Premium Özellik",
              "Bu özellik için premium paket almanız gerekmektedir."
            );
          }}
        >
          <Text style={styles.editPhotosButtonText}>Fotoğrafları Düzenle</Text>
          <FontAwesomeIcon icon={faFireAlt} size={20} color="#FF4500" />
        </TouchableOpacity>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Başlık</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="İlan başlığı"
        />

        <Text style={styles.label}>Açıklama</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="İlan açıklaması"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Fiyat (₺)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="Fiyat"
        />

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Kategori:</Text>
          <Text style={styles.infoValue}>{adDetails.categoryName}</Text>

          <Text style={styles.infoLabel}>Durum:</Text>
          <Text style={styles.infoValue}>{adDetails.status}</Text>

          <Text style={styles.infoLabel}>Adres:</Text>
          <Text style={styles.infoValue}>{adDetails.address}</Text>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: 350,
    position: "relative",
    backgroundColor: "#f8f8f8",
  },
  noImageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  adImage: {
    width: "100%",
    height: "100%",
  },
  imageSwipeLeft: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -20 }],
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  imageSwipeRight: {
    position: "absolute",
    left: 15,
    top: "50%",
    transform: [{ translateY: -20 }],
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    padding: 20,
    marginTop: 45,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  infoContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#8adbd2",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  editPhotosButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6347",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginLeft: 10,
    marginRight: 10,
  },
  editPhotosButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 8,
  },
});

export default EditAdScreen;
