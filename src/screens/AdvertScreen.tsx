import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  PanResponder,
  Animated,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import apiurl from "../Apiurl";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faMapMarkerAlt,
  faPhone,
  faMessage,
  faChevronLeft,
  faChevronRight,
  faArrowLeft,
  faEnvelope,
  faUser,
  faCalendarAlt,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import ImageViewing from "react-native-image-viewing";

type AdvertScreenRouteProp = RouteProp<RootStackParamList, "Advert">;
type AdvertScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Advert"
>;

type Props = {
  route: AdvertScreenRouteProp;
  navigation: AdvertScreenNavigationProp;
};

type Advert = {
  id: number;
  title: string;
  description: string;
  price: number;
  status: string;
  address: string;
  latitude: number;
  longitude: number;
  categoryId: number;
  categoryName: string;
  userId: string;
  sellerName: string;
  imageUrls: {
    $values: string[];
  };
  carDetail?: {
    brand: string;
    model: string;
    year: number;
    kilometre: number;
    horsePower: number;
    engineSize: number;
    bodyType: string;
    transmission: string;
    fuelType: string;
  };
};

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const AdvertScreen: React.FC<Props> = ({ route, navigation }) => {
  const [advert, setAdvert] = useState<Advert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        pan.x.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) > 40) {
          if (gesture.dx > 0) {
            handleImageSwipe("left");
          } else {
            handleImageSwipe("right");
          }
        }
        Animated.spring(pan.x, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const fetchAdvertDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Hata", "Oturum bilgisi bulunamadı");
        return;
      }

      const response = await fetch(
        `${apiurl}/api/ad-listings/${route.params.advertId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAdvert(data);
      checkFavoriteStatus(data.id);
    } catch (error) {
      console.error("İlan detayları yüklenirken hata:", error);
      Alert.alert("Hata", "İlan detayları yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  const checkFavoriteStatus = async (advertId: number) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const response = await fetch(`${apiurl}/api/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const favList = data.$values || data;
        const isFav =
          Array.isArray(favList) &&
          favList.some((fav: any) => fav.id === advertId);
        setIsFavorite(isFav);
      }
    } catch (error) {
      console.error("Favori durumu kontrol edilirken hata:", error);
    }
  };

  const handleShowMap = () => {
    setShowMap(true);
  };

  const handleImageSwipe = (direction: "left" | "right") => {
    if (!advert?.imageUrls.$values.length) return;

    const newIndex =
      direction === "left"
        ? (currentImageIndex - 1 + advert.imageUrls.$values.length) %
          advert.imageUrls.$values.length
        : (currentImageIndex + 1) % advert.imageUrls.$values.length;

    setCurrentImageIndex(newIndex);
  };

  const handleMessagePress = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Hata", "Lütfen önce giriş yapın");
        return;
      }

      if (!advert) return;

      const chatId = String(advert.userId);

      navigation.navigate("Messages", {
        userId: chatId,
        userName: advert.sellerName || "",
      });
    } catch (error) {
      console.error("Mesaj ekranına geçiş yapılırken hata:", error);
      Alert.alert("Hata", "Mesaj ekranına geçiş yapılamadı");
    }
  };

  const handleFavoritePress = async () => {
    try {
      setFavoriteLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Hata", "Lütfen önce giriş yapın");
        return;
      }
      if (!advert) return;

      let response;
      if (!isFavorite) {
        response = await fetch(`${apiurl}/api/favorites/add/${advert.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        response = await fetch(`${apiurl}/api/favorites/remove/${advert.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (response.ok) {
        setIsFavorite(!isFavorite);
      } else {
        const errorText = await response.text();
        Alert.alert("Hata", "Favori işlemi gerçekleştirilemedi: " + errorText);
      }
    } catch (error) {
      console.error("Favori işlemi sırasında hata:", error);
      Alert.alert("Hata", "Favori işlemi gerçekleştirilemedi");
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvertDetails();
  }, [route.params.advertId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!advert) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>İlan bulunamadı</Text>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.headerNew}>
          <TouchableOpacity
            style={styles.backButtonNew}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleNew}>İlan Detayları</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.imageGalleryContainer}>
            <TouchableOpacity
              style={styles.mainImageContainer}
              onPress={() => {
                setImageViewerIndex(currentImageIndex);
                setShowImageViewer(true);
              }}
              {...panResponder.panHandlers}
            >
              <Animated.Image
                source={{ uri: advert.imageUrls.$values[currentImageIndex] }}
                style={[
                  styles.mainImage,
                  {
                    transform: [{ translateX: pan.x }],
                  },
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {advert.imageUrls.$values.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.swipeButton, styles.swipeButtonLeft]}
                  onPress={() => handleImageSwipe("left")}
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    size={20}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.swipeButton, styles.swipeButtonRight]}
                  onPress={() => handleImageSwipe("right")}
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    size={20}
                    color="#fff"
                  />
                </TouchableOpacity>
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1}/{advert.imageUrls.$values.length}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.advertInfo}>
              <View style={styles.advertHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.advertTitle}>{advert.title}</Text>
                </View>
                <Text style={styles.advertPrice}>
                  {advert.price.toLocaleString("tr-TR")} ₺
                </Text>
              </View>
              <Text style={styles.advertDescription}>{advert.description}</Text>
            </View>

            {advert.carDetail && (
              <View style={styles.carDetailsContainer}>
                <Text style={styles.carDetailsTitle}>Araç Detayları</Text>
                <View style={styles.carDetailsGrid}>
                  <View style={styles.carDetailItem}>
                    <Text style={styles.carDetailLabel}>Marka</Text>
                    <Text style={styles.carDetailValue}>
                      {advert.carDetail.brand}
                    </Text>
                  </View>
                  <View style={styles.carDetailItem}>
                    <Text style={styles.carDetailLabel}>Model</Text>
                    <Text style={styles.carDetailValue}>
                      {advert.carDetail.model}
                    </Text>
                  </View>
                  <View style={styles.carDetailItem}>
                    <Text style={styles.carDetailLabel}>Yıl</Text>
                    <Text style={styles.carDetailValue}>
                      {advert.carDetail.year}
                    </Text>
                  </View>
                  <View style={styles.carDetailItem}>
                    <Text style={styles.carDetailLabel}>Kilometre</Text>
                    <Text style={styles.carDetailValue}>
                      {advert.carDetail.kilometre.toLocaleString("tr-TR")} km
                    </Text>
                  </View>
                  <View style={styles.carDetailItem}>
                    <Text style={styles.carDetailLabel}>Beygir Gücü</Text>
                    <Text style={styles.carDetailValue}>
                      {advert.carDetail.horsePower} HP
                    </Text>
                  </View>
                  <View style={styles.carDetailItem}>
                    <Text style={styles.carDetailLabel}>Motor Hacmi</Text>
                    <Text style={styles.carDetailValue}>
                      {advert.carDetail.engineSize} cc
                    </Text>
                  </View>
                  <View style={styles.carDetailItem}>
                    <Text style={styles.carDetailLabel}>Kasa Tipi</Text>
                    <Text style={styles.carDetailValue}>
                      {advert.carDetail.bodyType}
                    </Text>
                  </View>
                  <View style={styles.carDetailItem}>
                    <Text style={styles.carDetailLabel}>Vites</Text>
                    <Text style={styles.carDetailValue}>
                      {advert.carDetail.transmission}
                    </Text>
                  </View>
                  <View style={styles.carDetailItem}>
                    <Text style={styles.carDetailLabel}>Yakıt</Text>
                    <Text style={styles.carDetailValue}>
                      {advert.carDetail.fuelType}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <FontAwesomeIcon
                    icon={faUser}
                    size={18}
                    color={COLORS.text.primary}
                  />
                  <Text style={styles.infoText}>{advert.sellerName}</Text>
                </View>
                <View style={styles.infoItem}>
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    size={18}
                    color={COLORS.text.primary}
                  />
                  <Text style={styles.infoText}>{advert.status}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleShowMap}
              >
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.locationText}>{advert.address}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* ALT AKSİYON BUTONLARI */}
        <View style={styles.bottomActionsSmall}>
          <TouchableOpacity
            style={styles.bottomActionButtonSmall}
            onPress={handleMessagePress}
          >
            <FontAwesomeIcon icon={faEnvelope} size={20} color="#fff" />
            <Text style={styles.bottomActionTextSmall}>Mesaj</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomActionButtonSmall}
            onPress={handleFavoritePress}
            disabled={favoriteLoading}
          >
            {favoriteLoading ? (
              <ActivityIndicator size={18} color="#fff" />
            ) : (
              <FontAwesomeIcon
                icon={isFavorite ? faHeartSolid : faHeartRegular}
                size={20}
                color={isFavorite ? COLORS.secondary : "#fff"}
              />
            )}
            <Text style={styles.bottomActionTextSmall}>Favori</Text>
          </TouchableOpacity>
        </View>

        {/* Tam Ekran Görsel Modalı */}
        <Modal
          visible={showFullScreenImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFullScreenImage(false)}
        >
          <View style={styles.fullScreenModal}>
            <BlurView
              intensity={70}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity
              style={styles.closeButtonModern}
              onPress={() => setShowFullScreenImage(false)}
            >
              <FontAwesomeIcon icon={faTimes} size={26} color="#fff" />
            </TouchableOpacity>
            <View style={styles.fullScreenImageWrapper}>
              <Animated.Image
                source={{ uri: advert?.imageUrls.$values[currentImageIndex] }}
                style={[
                  styles.fullScreenImageModern,
                  {
                    transform: [{ translateX: pan.x }],
                  },
                ]}
                resizeMode="contain"
                {...panResponder.panHandlers}
              />
            </View>
            {advert?.imageUrls.$values.length > 1 && (
              <>
                <TouchableOpacity
                  style={[
                    styles.fullScreenSwipeButtonModern,
                    styles.fullScreenSwipeButtonLeftModern,
                  ]}
                  onPress={() => handleImageSwipe("left")}
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    size={22}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.fullScreenSwipeButtonModern,
                    styles.fullScreenSwipeButtonRightModern,
                  ]}
                  onPress={() => handleImageSwipe("right")}
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    size={22}
                    color="#fff"
                  />
                </TouchableOpacity>
              </>
            )}
            <View style={styles.fullScreenImageCounterBar}>
              <Text style={styles.fullScreenImageCounterText}>
                {currentImageIndex + 1}/{advert?.imageUrls.$values.length}
              </Text>
              <View style={styles.fullScreenProgressBarBg}>
                <View
                  style={[
                    styles.fullScreenProgressBarFill,
                    {
                      width: `${
                        ((currentImageIndex + 1) /
                          advert?.imageUrls.$values.length) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.fullScreenInfoText}>
              Kaydırarak diğer fotoğrafları görebilirsiniz
            </Text>
          </View>
        </Modal>

        {/* Harita Modalı */}
        {showMap && advert && (
          <Modal
            visible={showMap}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowMap(false)}
          >
            <TouchableOpacity
              style={styles.modal}
              activeOpacity={1}
              onPress={() => setShowMap(false)}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowMap(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Konum</Text>
                  <View style={{ width: 30 }} />
                </View>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: advert.latitude,
                    longitude: advert.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: advert.latitude,
                      longitude: advert.longitude,
                    }}
                  />
                </MapView>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Görsel zoom modalı */}
        <ImageViewing
          images={advert.imageUrls.$values.map((url) => ({ uri: url }))}
          imageIndex={imageViewerIndex}
          visible={showImageViewer}
          onRequestClose={() => setShowImageViewer(false)}
          backgroundColor="rgba(0,0,0,0.9)"
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "transparent",
    marginTop: Platform.OS === "ios" ? 0 : 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 15,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  imageGalleryContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    position: "relative",
    backgroundColor: COLORS.background,
  },
  mainImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  swipeButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  swipeButtonLeft: {
    left: 10,
  },
  swipeButtonRight: {
    right: 10,
  },
  imageCounter: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  detailsContainer: {
    padding: 28,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 32,
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  advertInfo: {
    flex: 1,
    marginLeft: 0,
    justifyContent: "flex-start",
    marginTop: 0,
  },
  advertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 18,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  advertTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.text.primary,
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  advertPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    backgroundColor: "#e6faf7",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 58,
    shadowColor: "#00A69333",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  advertDescription: {
    fontSize: 18,
    color: COLORS.text.secondary,
    lineHeight: 26,
    marginBottom: 22,
    fontWeight: "500",
  },
  infoContainer: {
    marginBottom: 18,
    backgroundColor: "#f7f9fc",
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6faf7",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 17,
    color: COLORS.text.primary,
    fontWeight: "600",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6faf7",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 6,
  },
  locationText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text.secondary,
    flex: 1,
    fontWeight: "500",
  },
  modal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 24,
    color: COLORS.text.secondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  map: {
    flex: 1,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImageWrapper: {
    width: "100%",
    height: "75%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    marginTop: 40,
    marginBottom: 16,
  },
  fullScreenImageModern: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },
  closeButtonModern: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 24,
    zIndex: 2,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  fullScreenSwipeButtonModern: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -24 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.22)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  fullScreenSwipeButtonLeftModern: {
    left: 18,
  },
  fullScreenSwipeButtonRightModern: {
    right: 18,
  },
  fullScreenImageCounterBar: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 3,
  },
  fullScreenImageCounterText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  fullScreenProgressBarBg: {
    width: 120,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 3,
    overflow: "hidden",
  },
  fullScreenProgressBarFill: {
    height: "100%",
    backgroundColor: "#8adbd2",
    borderRadius: 3,
  },
  fullScreenInfoText: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#fff",
    fontSize: 14,
    fontWeight: "400",
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    opacity: 0.85,
  },
  headerNew: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 18 : 38,
    paddingBottom: 12,
    backgroundColor: "#8adbd2",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 0,
    position: "relative",
  },
  backButtonNew: {
    position: "absolute",
    left: 18,
    top: Platform.OS === "ios" ? 18 : 38,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleNew: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingBottom: 24,
  },
  bottomActionsSmall: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#8adbd2",
    paddingVertical: 10,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomActionButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginHorizontal: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  bottomActionTextSmall: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  carDetailsContainer: {
    backgroundColor: "#f7f9fc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  carDetailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  carDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  carDetailItem: {
    width: "50%",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  carDetailLabel: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginBottom: 4,
  },
  carDetailValue: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: "600",
  },
});

export default AdvertScreen;
