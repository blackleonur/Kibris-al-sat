import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faCamera,
  faChevronDown,
  faChevronRight,
  faMapMarkerAlt,
  faTrash,
  faPlus,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import apiurl from "../Apiurl";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import TokenService from "../services/TokenService";
import { LinearGradient } from "expo-linear-gradient";

// Renk paletini güncelleyelim
const COLORS = {
  primary: "#00A693", // Modern Turkuaz
  secondary: "#FF6B6B", // Canlı Mercan
  background: "#F7F9FC", // Açık Gri-Mavi
  surface: "#FFFFFF",
  text: {
    primary: "#1A2138", // Koyu Lacivert
    secondary: "#4A5568", // Orta Gri
    tertiary: "#A0AEC0", // Açık Gri
  },
  border: "#E2E8F0",
  success: "#48BB78",
  warning: "#F6AD55",
  error: "#FC8181",
  shadow: "rgba(26, 33, 56, 0.1)",
};

type Props = NativeStackScreenProps<RootStackParamList, "AddAdvert">;

// Kategori tipleri
type Category = {
  id: number;
  name: string;
  parentId?: number;
  icon?: string;
};

// Sabit seçenekleri tanımlayalım
const BODY_TYPES = [
  "Sedan",
  "Hatchback",
  "Station Wagon",
  "SUV",
  "Crossover",
  "Pickup",
  "Van",
];

const TRANSMISSION_TYPES = ["Manuel", "Otomatik", "Yarı Otomatik", "CVT"];

const FUEL_TYPES = [
  "Benzin",
  "Dizel",
  "LPG",
  "Hibrit",
  "Elektrik",
  "Benzin & LPG",
];

// Motor gücü seçenekleri
const ENGINE_POWERS = [
  "25 hp'ye kadar",
  "26 - 50 hp",
  "51 - 75 hp",
  "76 - 100 hp",
  "101 - 125 hp",
  "126 - 150 hp",
  "151 - 175 hp",
  "176 - 200 hp",
  "201 - 225 hp",
  "226 - 250 hp",
  "251 - 275 hp",
  "276 - 300 hp",
  "301 - 325 hp",
  "326 - 350 hp",
  "351 - 375 hp",
  "376 - 400 hp",
  "401 - 425 hp",
  "426 - 450 hp",
  "451 - 475 hp",
  "476 - 500 hp",
  "501 - 525 hp",
  "526 - 550 hp",
  "551 - 575 hp",
  "576 - 600 hp",
  "601 hp ve üzeri",
];

// Motor hacmi seçenekleri
const ENGINE_SIZES = [
  "0 - 49 cm³",
  "50 - 125 cm³",
  "126 - 250 cm³",
  "251 - 400 cm³",
  "401 - 600 cm³",
  "601 - 750 cm³",
  "751 - 900 cm³",
  "901 - 1000 cm³",
  "1001 - 1200 cm³",
  "1301 - 1600 cm³",
  "1601 - 1800 cm³",
  "1801 - 2000 cm³",
  "2001 - 2500 cm³",
  "2501 - 3000 cm³",
  "3001 - 3500 cm³",
  "3501 - 4000 cm³",
  "4001 - 4500 cm³",
  "4501 - 5000 cm³",
  "5001 - 5500 cm³",
  "5501 - 6000 cm³",
  "6001 cm³ ve üzeri",
];

// Yıl seçenekleri
const YEARS = Array.from({ length: 66 }, (_, i) => (2025 - i).toString());

const AddAdvertScreen: React.FC<Props> = ({ navigation }): JSX.Element => {
  // State'ler
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceGBP, setPriceGBP] = useState("");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(false);
  const [activeInput, setActiveInput] = useState<"TRY" | "GBP">("TRY");
  const [priceInGBP, setPriceInGBP] = useState<string>("");
  const [address, setAddress] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [currentPickerLevel, setCurrentPickerLevel] = useState(1);
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [addressDetails, setAddressDetails] = useState({
    city: "",
    district: "",
    neighborhood: "",
    street: "",
    latitude: 0,
    longitude: 0,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [carDetails, setCarDetails] = useState({
    year: "",
    kilometre: "",
    horsePower: "",
    engineSize: "",
    bodyType: "",
    transmission: "",
    fuelType: "",
  });
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showHorsePowerPicker, setShowHorsePowerPicker] = useState(false);
  const [showEngineSizePicker, setShowEngineSizePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Döviz kurunu getiren fonksiyon
  const fetchExchangeRate = async () => {
    try {
      setIsLoadingExchangeRate(true);
      const response = await fetch("https://open.er-api.com/v6/latest/TRY");
      const data = await response.json();
      if (data.rates && data.rates.GBP) {
        setExchangeRate(data.rates.GBP);
      }
    } catch (error) {
      console.error("Döviz kuru alınırken hata oluştu:", error);
    } finally {
      setIsLoadingExchangeRate(false);
    }
  };

  // Component mount olduğunda döviz kurunu al
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // Fiyat değiştiğinde GBP karşılığını hesapla
  useEffect(() => {
    if (price && exchangeRate) {
      const priceInGBP = (parseFloat(price) * exchangeRate).toFixed(2);
      setPriceInGBP(priceInGBP);
    } else {
      setPriceInGBP("");
    }
  }, [price, exchangeRate]);

  // Araç kategorilerini getiren fonksiyon
  const fetchVehicleCategories = async () => {
    try {
      const response = await fetch(`${apiurl}/api/vehicle-categories`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Tüm alt kategorileri düz bir diziye çeviren yardımcı fonksiyon
      const flattenCategories = (
        category: any,
        parentId?: number
      ): Category[] => {
        if (!category || !category.id) return [];

        const current: Category = {
          id: category.id,
          name: category.name,
          icon: category.children?.$values?.length ? "car" : "view-grid",
          parentId: parentId,
        };

        if (!category.children?.$values?.length) {
          return [current];
        }

        const children = category.children.$values
          .map((child: any) => flattenCategories(child, category.id))
          .flat();

        return [current, ...children];
      };

      const allCategories = flattenCategories(data);

      // Tekrar eden kategorileri filtrele
      const uniqueCategories = allCategories.filter(
        (category, index, self) =>
          index === self.findIndex((c) => c.id === category.id)
      );

      setVehicleCategories(uniqueCategories);
    } catch (error) {
      console.error("Araç kategorileri yüklenirken hata oluştu:", error);
    }
  };

  // Kategorileri getiren fonksiyon
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${apiurl}/api/categories`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!data || !data.$values) {
        console.error("API'den geçersiz veri formatı:", data);
        return;
      }

      const flattenCategories = (
        category: any,
        parentId?: number
      ): Category[] => {
        if (!category || !category.id) return [];

        const current: Category = {
          id: category.id,
          name: category.name,
          parentId: parentId,
        };

        if (!category.children?.$values?.length) {
          return [current];
        }

        const children = category.children.$values
          .map((child: any) => flattenCategories(child, category.id))
          .flat();

        return [current, ...children];
      };

      const allCategories = data.$values
        .map((category: any) => flattenCategories(category))
        .flat();

      // Tekrar eden kategorileri filtrele
      const uniqueCategories = allCategories.filter(
        (category: Category, index: number, self: Category[]) =>
          index === self.findIndex((c: Category) => c.id === category.id)
      );

      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Kategoriler yüklenirken hata oluştu:", error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Eğer seçili kategori araç kategorisi (id: 1) ise, araç kategorilerini getir
    if (selectedCategories[0] === 1) {
      fetchVehicleCategories();
    }
  }, [selectedCategories]);

  // Kategori seçme fonksiyonu
  const handleCategorySelect = (categoryId: number, level: number) => {
    // Seçilen seviyeden sonraki tüm seçimleri temizle
    const newSelectedCategories = selectedCategories.slice(0, level);

    // Yeni kategoriyi ekle
    newSelectedCategories[level] = categoryId;
    setSelectedCategories(newSelectedCategories);

    // Eğer seçilen kategori araç kategorisi ise, araç kategorilerini getir
    if (categoryId === 1 && level === 0) {
      fetchVehicleCategories();
    }
  };

  // Kategori seviyesini render etme
  const renderCategoryLevel = (level: number) => {
    // Eğer önceki seviye seçilmemişse, bu seviyeyi gösterme
    if (level > 0 && !selectedCategories[level - 1]) {
      return null;
    }

    let categoryList: Category[] = [];
    const parentId = level === 0 ? undefined : selectedCategories[level - 1];

    if (level === 0) {
      // Ana kategoriler
      categoryList = categories.filter((cat) => !cat.parentId);
    } else if (selectedCategories[0] === 1 && level === 1) {
      // Araç alt kategorileri
      categoryList = vehicleCategories.filter((cat) => cat.parentId === 1);
    } else if (selectedCategories[0] === 1 && level > 1) {
      // Araç alt-alt kategorileri
      categoryList = vehicleCategories.filter(
        (cat) => cat.parentId === selectedCategories[level - 1]
      );
    } else {
      // Diğer kategorilerin alt kategorileri
      categoryList = categories.filter((cat) => cat.parentId === parentId);
    }

    if (categoryList.length === 0) return null;

    if (level === 0) {
      // Ana kategoriler için grid görünümü
      return (
        <View key={`level-${level}`} style={styles.categoryLevel}>
          <Text style={styles.inputLabel}>Ana Kategori</Text>
          <View style={styles.categoriesContainer}>
            {categoryList.map((category) => (
              <TouchableOpacity
                key={`cat-${level}-${category.id}`}
                style={[
                  styles.categoryButton,
                  selectedCategories[level] === category.id &&
                    styles.selectedCategoryButton,
                ]}
                onPress={() => handleCategorySelect(category.id, level)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategories[level] === category.id &&
                      styles.selectedCategoryButtonText,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    } else {
      // Alt kategoriler için picker butonu
      const selectedCategory = categoryList.find(
        (cat) => cat.id === selectedCategories[level]
      );

      return (
        <View key={`level-${level}`} style={styles.categoryLevel}>
          <Text style={[styles.inputLabel, { marginTop: 20 }]}>
            {`${level}. Alt Kategori`}
          </Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              setCurrentPickerLevel(level);
              setShowPicker(true);
            }}
          >
            <Text style={styles.pickerButtonText}>
              {selectedCategory ? selectedCategory.name : "Alt kategori seçin"}
            </Text>
            <FontAwesomeIcon icon={faChevronDown} size={16} color="#666" />
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Picker modalını render etme
  const renderPickerModal = () => {
    let categoryList: Category[] = [];
    const parentId =
      currentPickerLevel === 0
        ? undefined
        : selectedCategories[currentPickerLevel - 1];

    if (selectedCategories[0] === 1 && currentPickerLevel === 1) {
      categoryList = vehicleCategories.filter((cat) => cat.parentId === 1);
    } else if (selectedCategories[0] === 1 && currentPickerLevel > 1) {
      categoryList = vehicleCategories.filter(
        (cat) => cat.parentId === selectedCategories[currentPickerLevel - 1]
      );
    } else {
      categoryList = categories.filter((cat) => cat.parentId === parentId);
    }

    return (
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text
                style={styles.modalTitle}
              >{`${currentPickerLevel}. Alt Kategori Seçin`}</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {categoryList.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.modalItem,
                    selectedCategories[currentPickerLevel] === category.id &&
                      styles.selectedModalItem,
                  ]}
                  onPress={() => {
                    handleCategorySelect(category.id, currentPickerLevel);
                    setShowPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedCategories[currentPickerLevel] === category.id &&
                        styles.selectedModalItemText,
                    ]}
                  >
                    {category.name}
                  </Text>
                  {(selectedCategories[0] === 1
                    ? vehicleCategories.some(
                        (cat) => cat.parentId === category.id
                      )
                    : categories.some(
                        (cat) => cat.parentId === category.id
                      )) && (
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      size={16}
                      color={
                        selectedCategories[currentPickerLevel] === category.id
                          ? "#8adbd2"
                          : "#ccc"
                      }
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Sonraki seviyede kategori olup olmadığını kontrol eden fonksiyon
  const hasNextLevelCategories = (currentLevel: number): boolean => {
    if (currentLevel < 0) return false;

    const currentCategoryId = selectedCategories[currentLevel];
    if (!currentCategoryId) return false;

    if (selectedCategories[0] === 1) {
      // Araç kategorileri için kontrol
      return vehicleCategories.some(
        (cat) => cat.parentId === currentCategoryId
      );
    } else {
      // Diğer kategoriler için kontrol
      return categories.some((cat) => cat.parentId === currentCategoryId);
    }
  };

  // Kategori seçiminin tamamlanıp tamamlanmadığını kontrol eden fonksiyon
  const isCategorySelectionComplete = (): boolean => {
    let lastSelectedLevel = -1;

    // Son seçili seviyeyi bul
    for (let i = selectedCategories.length - 1; i >= 0; i--) {
      if (selectedCategories[i]) {
        lastSelectedLevel = i;
        break;
      }
    }

    // Eğer araç kategorisi seçilmişse, araç detaylarının tamamlanıp tamamlanmadığını kontrol et
    if (selectedCategories[0] === 1) {
      const requiredFields = [
        carDetails.year,
        carDetails.kilometre,
        carDetails.horsePower,
        carDetails.engineSize,
        carDetails.bodyType,
        carDetails.transmission,
        carDetails.fuelType,
      ];
      return !requiredFields.some((field) => !field);
    }

    // Son seçili seviyeden sonra alt kategori var mı kontrol et
    return !hasNextLevelCategories(lastSelectedLevel);
  };

  // Fotoğraf ekleme fonksiyonu
  const addPhoto = async () => {
    if (photos.length >= 10) {
      Alert.alert("Uyarı", "En fazla 10 fotoğraf ekleyebilirsiniz.");
      return;
    }

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Hata", "Galeri izni gerekli");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.uri) {
          setPhotos([...photos, asset.uri]); // URI'yi kaydet
        }
      }
    } catch (error) {
      console.error("Fotoğraf seçilirken hata oluştu:", error);
      Alert.alert("Hata", "Fotoğraf seçilemedi");
    }
  };

  // Fotoğraf silme fonksiyonu
  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  // Konum izni ve konum alma fonksiyonu
  const getLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Hata", "Konum izni gerekli");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setLocation(newLocation);
      setAddressDetails((prev) => ({
        ...prev,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      }));
      setShowMap(true);
    } catch (error) {
      Alert.alert("Hata", "Konum alınamadı");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Seçilen konumdan adres bilgilerini alma
  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (response && response[0]) {
        const addressData = response[0];
        console.log("Alınan adres bilgileri:", addressData);

        const newAddressDetails = {
          city:
            addressData.city ||
            addressData.region ||
            addressData.subregion ||
            "",
          district: addressData.subregion || addressData.district || "",
          neighborhood: addressData.district || addressData.name || "",
          street: addressData.street || addressData.name || "",
          latitude,
          longitude,
        };

        setAddressDetails(newAddressDetails);

        const fullAddress = [
          newAddressDetails.street,
          newAddressDetails.neighborhood,
          newAddressDetails.district,
          newAddressDetails.city,
        ]
          .filter(Boolean)
          .join(", ");

        setAddress(fullAddress);

        console.log("Oluşturulan adres detayları:", newAddressDetails);
        console.log("Oluşturulan tam adres:", fullAddress);

        const missingFields = Object.entries(newAddressDetails)
          .filter(
            ([key, value]) =>
              !value && key !== "latitude" && key !== "longitude"
          )
          .map(([key]) => key);

        if (missingFields.length > 0) {
          Alert.alert(
            "Bilgi",
            "Bazı adres bilgileri eksik. Lütfen eksik bilgileri manuel olarak tamamlayın:\n" +
              missingFields.join(", ")
          );
        }
      } else {
        console.log("Adres bilgisi bulunamadı");
        Alert.alert(
          "Uyarı",
          "Bu konum için adres bilgileri bulunamadı. Lütfen adres bilgilerini manuel olarak giriniz."
        );
      }
    } catch (error) {
      console.error("Adres bilgileri alınırken hata oluştu:", error);
      Alert.alert(
        "Hata",
        "Adres bilgileri alınamadı. Lütfen adres bilgilerini manuel olarak giriniz."
      );
    }
  };

  // Harita üzerinde konum seçildiğinde
  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
    setAddressDetails((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));
    getAddressFromCoordinates(latitude, longitude);
  };

  // Harita modalı
  const renderMapModal = () => {
    return (
      <Modal
        visible={showMap}
        animationType="slide"
        onRequestClose={() => setShowMap(false)}
      >
        <SafeAreaView style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity
              style={styles.mapCloseButton}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.mapCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Konum Seç</Text>
            <TouchableOpacity
              style={styles.mapConfirmButton}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.mapConfirmButtonText}>Onayla</Text>
            </TouchableOpacity>
          </View>
          {location && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              onPress={handleMapPress}
            >
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
              />
            </MapView>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  // Adres detayları formu
  const renderAddressDetails = () => {
    return (
      <View style={styles.addressDetails}>
        <View style={styles.addressRow}>
          <View style={styles.addressField}>
            <Text style={styles.addressLabel}>Şehir</Text>
            <TextInput
              style={styles.addressInput}
              value={addressDetails.city}
              onChangeText={(text) => {
                setAddressDetails({ ...addressDetails, city: text });
                updateFullAddress({ ...addressDetails, city: text });
              }}
              placeholder="Şehir"
            />
          </View>
          <View style={styles.addressField}>
            <Text style={styles.addressLabel}>İlçe</Text>
            <TextInput
              style={styles.addressInput}
              value={addressDetails.district}
              onChangeText={(text) => {
                setAddressDetails({ ...addressDetails, district: text });
                updateFullAddress({ ...addressDetails, district: text });
              }}
              placeholder="İlçe"
            />
          </View>
        </View>
        <View style={styles.addressRow}>
          <View style={styles.addressField}>
            <Text style={styles.addressLabel}>Mahalle</Text>
            <TextInput
              style={styles.addressInput}
              value={addressDetails.neighborhood}
              onChangeText={(text) => {
                setAddressDetails({ ...addressDetails, neighborhood: text });
                updateFullAddress({ ...addressDetails, neighborhood: text });
              }}
              placeholder="Mahalle"
            />
          </View>
          <View style={styles.addressField}>
            <Text style={styles.addressLabel}>Sokak</Text>
            <TextInput
              style={styles.addressInput}
              value={addressDetails.street}
              onChangeText={(text) => {
                setAddressDetails({ ...addressDetails, street: text });
                updateFullAddress({ ...addressDetails, street: text });
              }}
              placeholder="Sokak"
            />
          </View>
        </View>
      </View>
    );
  };

  // Tam adresi güncelleme
  const updateFullAddress = (details: typeof addressDetails) => {
    const fullAddress = [
      details.street,
      details.neighborhood,
      details.district,
      details.city,
    ]
      .filter(Boolean)
      .join(", ");
    setAddress(fullAddress);
  };

  // Adres adımını güncelleme
  const renderAddressStep = () => {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.inputLabel}>Adres</Text>
        <View style={styles.addressInputContainer}>
          <TextInput
            style={styles.addressInput}
            value={address}
            onChangeText={setAddress}
            placeholder="Adresinizi girin"
            multiline
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getLocation}
            disabled={isLoadingLocation}
          >
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              size={20}
              color={isLoadingLocation ? "#ccc" : "#8adbd2"}
            />
          </TouchableOpacity>
        </View>
        {renderAddressDetails()}
      </View>
    );
  };

  // Base64'e çevirme fonksiyonu
  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (base64.length === 0) {
        throw new Error("Base64 dönüşümü başarısız - boş string");
      }

      return base64;
    } catch (error) {
      console.error("Resim base64'e çevrilirken hata:", error);
      throw error;
    }
  };

  // TL fiyatı değiştiğinde GBP karşılığını hesapla
  const handleTRYPriceChange = (text: string) => {
    // Sadece sayıları al
    const numbers = text.replace(/[^\d]/g, "");
    // Her 3 basamaktan sonra nokta ekle
    const formattedNumber = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setPrice(formattedNumber);

    if (exchangeRate && numbers) {
      // TL'den GBP'ye çevirirken yukarı yuvarla
      const gbpValue = Math.ceil(parseFloat(numbers) * exchangeRate);
      setPriceGBP(gbpValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
    } else {
      setPriceGBP("");
    }
  };

  // GBP fiyatı değiştiğinde TL karşılığını hesapla
  const handleGBPPriceChange = (text: string) => {
    // Sadece sayıları al
    const numbers = text.replace(/[^\d]/g, "");
    // Her 3 basamaktan sonra nokta ekle
    const formattedNumber = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setPriceGBP(formattedNumber);

    if (exchangeRate && numbers) {
      // GBP'den TL'ye çevirirken yukarı yuvarla
      const tryValue = Math.ceil(parseFloat(numbers) / exchangeRate);
      setPrice(tryValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
    } else {
      setPrice("");
    }
  };

  // Araç detayları formunu render etme
  const renderCarDetails = () => {
    if (selectedCategories[0] !== 1) return null;

    return (
      <View style={styles.carDetailsContainer}>
        <Text style={styles.inputLabel}>Araç Detayları</Text>

        <View style={styles.carDetailsRow}>
          <View style={styles.carDetailsField}>
            <Text style={styles.carDetailsLabel}>Model Yılı</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowYearPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {carDetails.year || "Model yılı seçin"}
              </Text>
              <FontAwesomeIcon icon={faChevronDown} size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.carDetailsRow}>
          <View style={styles.carDetailsField}>
            <Text style={styles.carDetailsLabel}>Kilometre</Text>
            <TextInput
              style={styles.carDetailsInput}
              value={carDetails.kilometre}
              onChangeText={(text) => {
                // Sadece sayıları al
                const numbers = text.replace(/[^\d]/g, "");
                // Her 3 basamaktan sonra nokta ekle
                const formattedNumber = numbers.replace(
                  /\B(?=(\d{3})+(?!\d))/g,
                  "."
                );
                setCarDetails({ ...carDetails, kilometre: formattedNumber });
              }}
              placeholder="Kilometre"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.carDetailsRow}>
          <View style={styles.carDetailsField}>
            <Text style={styles.carDetailsLabel}>Beygir Gücü</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowHorsePowerPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {carDetails.horsePower || "Beygir gücü seçin"}
              </Text>
              <FontAwesomeIcon icon={faChevronDown} size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.carDetailsRow}>
          <View style={styles.carDetailsField}>
            <Text style={styles.carDetailsLabel}>Motor Hacmi</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowEngineSizePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {carDetails.engineSize || "Motor hacmi seçin"}
              </Text>
              <FontAwesomeIcon icon={faChevronDown} size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.carDetailsRow}>
          <View style={styles.carDetailsField}>
            <Text style={styles.carDetailsLabel}>Kasa Tipi</Text>
            <View style={styles.optionsContainer}>
              {BODY_TYPES.map((type) => (
                <TouchableOpacity
                  key={`type-${type}`}
                  style={[
                    styles.optionButton,
                    carDetails.bodyType === type && styles.selectedOptionButton,
                  ]}
                  onPress={() =>
                    setCarDetails({ ...carDetails, bodyType: type })
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      carDetails.bodyType === type && styles.selectedOptionText,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.carDetailsRow}>
          <View style={styles.carDetailsField}>
            <Text style={styles.carDetailsLabel}>Vites</Text>
            <View style={styles.optionsContainer}>
              {TRANSMISSION_TYPES.map((type) => (
                <TouchableOpacity
                  key={`transmission-${type}`}
                  style={[
                    styles.optionButton,
                    carDetails.transmission === type &&
                      styles.selectedOptionButton,
                  ]}
                  onPress={() =>
                    setCarDetails({ ...carDetails, transmission: type })
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      carDetails.transmission === type &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.carDetailsRow}>
          <View style={styles.carDetailsField}>
            <Text style={styles.carDetailsLabel}>Yakıt Tipi</Text>
            <View style={styles.optionsContainer}>
              {FUEL_TYPES.map((type) => (
                <TouchableOpacity
                  key={`fuel-${type}`}
                  style={[
                    styles.optionButton,
                    carDetails.fuelType === type && styles.selectedOptionButton,
                  ]}
                  onPress={() =>
                    setCarDetails({ ...carDetails, fuelType: type })
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      carDetails.fuelType === type && styles.selectedOptionText,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Yıl Seçici Modal */}
        <Modal
          visible={showYearPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowYearPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Model Yılı Seçin</Text>
                <TouchableOpacity
                  style={styles.modalCloseButtonContainer}
                  onPress={() => setShowYearPicker(false)}
                >
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                {YEARS.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.modalItem,
                      carDetails.year === year && styles.selectedModalItem,
                    ]}
                    onPress={() => {
                      setCarDetails({ ...carDetails, year: year });
                      setShowYearPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        carDetails.year === year &&
                          styles.selectedModalItemText,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Beygir Gücü Seçici Modal */}
        <Modal
          visible={showHorsePowerPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowHorsePowerPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Beygir Gücü Seçin</Text>
                <TouchableOpacity
                  style={styles.modalCloseButtonContainer}
                  onPress={() => setShowHorsePowerPicker(false)}
                >
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                {ENGINE_POWERS.map((power) => (
                  <TouchableOpacity
                    key={power}
                    style={[
                      styles.modalItem,
                      carDetails.horsePower === power &&
                        styles.selectedModalItem,
                    ]}
                    onPress={() => {
                      setCarDetails({ ...carDetails, horsePower: power });
                      setShowHorsePowerPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        carDetails.horsePower === power &&
                          styles.selectedModalItemText,
                      ]}
                    >
                      {power}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Motor Hacmi Seçici Modal */}
        <Modal
          visible={showEngineSizePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEngineSizePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Motor Hacmi Seçin</Text>
                <TouchableOpacity
                  style={styles.modalCloseButtonContainer}
                  onPress={() => setShowEngineSizePicker(false)}
                >
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                {ENGINE_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.modalItem,
                      carDetails.engineSize === size &&
                        styles.selectedModalItem,
                    ]}
                    onPress={() => {
                      setCarDetails({ ...carDetails, engineSize: size });
                      setShowEngineSizePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        carDetails.engineSize === size &&
                          styles.selectedModalItemText,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  // İlan ekleme fonksiyonunu güncelle
  const addAdvert = async () => {
    if (isLoading) return;

    // Validasyon kontrolleri
    if (selectedCategories.length === 0) {
      Alert.alert("Hata", "Lütfen bir kategori seçin.");
      return;
    }

    // Araç kategorisi için ek validasyonlar
    if (selectedCategories[0] === 1) {
      const requiredFields = [
        carDetails.year,
        carDetails.kilometre,
        carDetails.horsePower,
        carDetails.engineSize,
        carDetails.bodyType,
        carDetails.transmission,
        carDetails.fuelType,
      ];

      if (requiredFields.some((field) => !field)) {
        Alert.alert("Hata", "Lütfen tüm araç detaylarını doldurun.");
        return;
      }
    }

    if (photos.length === 0) {
      Alert.alert("Hata", "Lütfen en az bir fotoğraf ekleyin.");
      return;
    }

    if (title.length === 0) {
      Alert.alert("Hata", "Lütfen bir başlık girin.");
      return;
    }

    if (title.length > 20) {
      Alert.alert("Hata", "Başlık en fazla 20 karakter olabilir.");
      return;
    }

    if (description.length < 30) {
      Alert.alert("Hata", "Açıklama en az 30 karakter olmalıdır.");
      return;
    }

    if (address.length === 0) {
      Alert.alert("Hata", "Lütfen bir adres girin.");
      return;
    }

    if (addressDetails.latitude === 0 || addressDetails.longitude === 0) {
      Alert.alert("Hata", "Lütfen haritadan konum seçin.");
      return;
    }

    if (price.length === 0) {
      Alert.alert("Hata", "Lütfen bir fiyat girin.");
      return;
    }

    try {
      setIsLoading(true);

      const [isValid, token] = await Promise.all([
        TokenService.isTokenValid(),
        TokenService.getToken(),
      ]);

      if (!isValid || !token) {
        Alert.alert(
          "Uyarı",
          "Oturumunuz sonlanmış. Lütfen tekrar giriş yapın."
        );
        return;
      }

      // Tüm fotoğrafları base64'e çevir
      const base64Images: string[] = [];
      for (const photoUri of photos) {
        try {
          const base64 = await convertImageToBase64(photoUri);
          base64Images.push(base64);
        } catch (error) {
          console.error("Resim base64'e çevrilirken hata:", error);
          Alert.alert(
            "Uyarı",
            "Bazı resimler yüklenemedi. Lütfen tekrar deneyin."
          );
          return;
        }
      }

      // Son seçili kategori ID'sini al
      const lastSelectedCategoryId =
        selectedCategories[selectedCategories.length - 1];

      // İlan verilerini hazırla
      const advertData = {
        title: title.trim(),
        description: description.trim(),
        price: parseInt(price.replace(/\./g, "")),
        currency: "TRY",
        categoryId: lastSelectedCategoryId,
        status: "Beklemede",
        address: address.trim(),
        latitude: addressDetails.latitude,
        longitude: addressDetails.longitude,
        base64Images: base64Images,
        ...(selectedCategories[0] === 1 && {
          brand: selectedCategories[1]
            ? vehicleCategories.find((cat) => cat.id === selectedCategories[1])
                ?.name
            : "",
          model: selectedCategories[2]
            ? vehicleCategories.find((cat) => cat.id === selectedCategories[2])
                ?.name
            : "",
          year: parseInt(carDetails.year),
          kilometre: parseInt(carDetails.kilometre.replace(/\./g, "")),
          horsePower: parseInt(carDetails.horsePower),
          engineSize: parseInt(carDetails.engineSize),
          bodyType: carDetails.bodyType,
          transmission: carDetails.transmission,
          fuelType: carDetails.fuelType,
        }),
      };

      // API endpoint'i seç
      const endpoint =
        selectedCategories[0] === 1
          ? `${apiurl}/api/ad-listings/cars`
          : `${apiurl}/api/ad-listings`;

      // Timeout kontrolü için Promise.race kullan
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("timeout"));
        }, 15000); // 15 saniye
      });

      const fetchPromise = fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(advertData),
      });

      const response = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (!response.ok) {
        const errorText = await response.text();
        console.error("İlan ekleme yanıtı:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `İlan ekleme başarısız: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      console.log("İlan başarıyla eklendi:", result);

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("İlan eklenirken hata oluştu:", error);

      // Timeout hatası kontrolü
      if (error.message === "timeout") {
        Alert.alert(
          "Bağlantı Hatası",
          "İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin."
        );
      } else {
        Alert.alert(
          "Hata",
          "İlan eklenirken bir hata oluştu. Lütfen tekrar deneyin."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sonraki adıma geçme fonksiyonu
  const nextStep = () => {
    if (currentStep === 1) {
      if (!isCategorySelectionComplete()) {
        Alert.alert("Hata", "Lütfen kategori seçimlerini eksiksiz tamamlayın.");
        return;
      }
    } else if (currentStep === 2) {
      if (photos.length === 0) {
        Alert.alert("Hata", "Lütfen en az bir fotoğraf ekleyin.");
        return;
      }
    } else if (currentStep === 3) {
      if (title.length === 0 || title.length > 20) {
        Alert.alert("Hata", "Başlık 1-20 karakter arasında olmalıdır.");
        return;
      }
      if (description.length < 30) {
        Alert.alert("Hata", "Açıklama en az 30 karakter olmalıdır.");
        return;
      }
    } else if (currentStep === 4) {
      if (address.length === 0) {
        Alert.alert("Hata", "Lütfen bir adres girin.");
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Önceki adıma dönme fonksiyonu
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      navigation.goBack();
    }
  };

  // Adım başlıklarını render etme
  const renderStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Kategori Seçimi";
      case 2:
        return "Fotoğraf Ekle";
      case 3:
        return "Başlık ve Açıklama";
      case 4:
        return "Adres";
      case 5:
        return "Fiyat";
      default:
        return "";
    }
  };

  // Adım içeriğini render etme
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            {[0, 1, 2, 3, 4].map((level) => renderCategoryLevel(level))}
            {renderCarDetails()}
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.inputLabel}>
              Fotoğraflar ({photos.length}/10)
            </Text>
            <Text style={styles.inputDescription}>
              En az 1, en fazla 10 fotoğraf ekleyebilirsiniz.
            </Text>

            <View style={styles.photosContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <FontAwesomeIcon icon={faTrash} size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}

              {photos.length < 10 && (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={addPhoto}
                >
                  <FontAwesomeIcon icon={faCamera} size={24} color="#8adbd2" />
                  <Text style={styles.addPhotoText}>Fotoğraf Ekle</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.inputLabel}>Başlık</Text>
            <Text style={styles.inputDescription}>
              En fazla 20 karakter (Şu an: {title.length})
            </Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ürün başlığı girin"
              maxLength={20}
            />

            <Text style={styles.inputLabel}>Açıklama</Text>
            <Text style={styles.inputDescription}>
              En az 30 karakter (Şu an: {description.length})
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Ürün açıklaması girin"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        );
      case 4:
        return renderAddressStep();
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.inputLabel}>Fiyat</Text>
            <View style={styles.priceInputsContainer}>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currencyLabel}>₺</Text>
                <TextInput
                  style={[
                    styles.priceInput,
                    activeInput === "TRY" && styles.activePriceInput,
                  ]}
                  value={price}
                  onChangeText={handleTRYPriceChange}
                  placeholder="TL"
                  keyboardType="numeric"
                  editable={!isLoading}
                  onFocus={() => setActiveInput("TRY")}
                />
              </View>

              <View style={styles.priceInputWrapper}>
                <Text style={styles.currencyLabel}>£</Text>
                <TextInput
                  style={[
                    styles.priceInput,
                    activeInput === "GBP" && styles.activePriceInput,
                  ]}
                  value={priceGBP}
                  onChangeText={handleGBPPriceChange}
                  placeholder="GBP"
                  keyboardType="numeric"
                  editable={!isLoading}
                  onFocus={() => setActiveInput("GBP")}
                />
              </View>
            </View>

            {isLoadingExchangeRate && (
              <View style={styles.exchangeRateInfo}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.exchangeRateText}>
                  Döviz kuru yükleniyor...
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.completeButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={addAdvert}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.completeButtonText, styles.loadingText]}>
                    İlan Yükleniyor...
                  </Text>
                </View>
              ) : (
                <Text style={styles.completeButtonText}>İlanı Yayınla</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  // Başarı modalını render etme
  const renderSuccessModal = () => {
    return (
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successModalContent}>
              <View style={styles.successIconContainer}>
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  size={50}
                  color={COLORS.success}
                />
              </View>
              <Text style={styles.successTitle}>
                İlanınız Başarıyla Yayınlandı!
              </Text>
              <Text style={styles.successDescription}>
                İlanınız yayınlanmıştır ilanlarım kısmından kontrol
                sağlayabilirsiniz.
              </Text>
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.navigate("Home");
                }}
              >
                <Text style={styles.successButtonText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <LinearGradient
      colors={["#8adbd2", "#f5f5f5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{renderStepTitle()}</Text>
              <View style={styles.stepIndicatorContainer}>
                <Text style={styles.stepIndicator}>{currentStep}/5</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / 5) * 100}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        {currentStep < 5 && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
              <Text style={styles.nextButtonText}>Devam Et</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderPickerModal()}
        {renderMapModal()}
        {renderSuccessModal()}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "transparent",
    paddingTop: Platform.OS === "ios" ? 0 : 30,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  stepIndicatorContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  stepIndicator: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: "600",
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  backButton: {
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
  stepContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: 5,
  },
  inputDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    color: COLORS.text.primary,
  },
  textArea: {
    height: 120,
  },
  footer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  modalCloseButtonContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  modalCloseButton: {
    fontSize: 24,
    color: COLORS.text.tertiary,
    fontWeight: "bold",
  },
  modalContent: {
    maxHeight: "70%",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: "#fff",
  },
  selectedModalItem: {
    backgroundColor: "#f0f7ff",
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  selectedModalItemText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
    marginTop: 10,
  },
  categoryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    margin: 5,
    minWidth: "30%",
  },
  selectedCategoryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: COLORS.text.primary,
    textAlign: "center",
  },
  selectedCategoryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  categoryLevel: {
    marginBottom: 20,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  pickerButtonText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mapCloseButton: {
    padding: 5,
  },
  mapCloseButtonText: {
    fontSize: 20,
    color: COLORS.text.primary,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  mapConfirmButton: {
    padding: 5,
  },
  mapConfirmButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  map: {
    flex: 1,
  },
  addressDetails: {
    marginTop: 20,
  },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  addressField: {
    flex: 1,
    marginHorizontal: 5,
  },
  addressLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 5,
  },
  addressInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  locationButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginLeft: 10,
    color: COLORS.text.primary,
  },
  photosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  photoItem: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  removePhotoButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  addPhotoText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 5,
    textAlign: "center",
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  addressInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  priceInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currencyLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    height: 45,
    fontSize: 18,
    color: COLORS.text.primary,
    paddingHorizontal: 5,
    fontWeight: "500",
  },
  activePriceInput: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  exchangeRateInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exchangeRateText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    marginHorizontal: -5,
    maxHeight: 200, // Seçeneklerin yüksekliğini sınırla
  },
  optionButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 5,
  },
  selectedOptionButton: {
    backgroundColor: "#8adbd2",
  },
  optionText: {
    fontSize: 14,
    color: "#666",
  },
  selectedOptionText: {
    color: "#fff",
    fontWeight: "500",
  },
  carDetailsContainer: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  carDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  carDetailsField: {
    flex: 1,
    marginHorizontal: 5,
  },
  carDetailsLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 5,
  },
  carDetailsInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  successModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  successModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(72, 187, 120, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  successDescription: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddAdvertScreen;
