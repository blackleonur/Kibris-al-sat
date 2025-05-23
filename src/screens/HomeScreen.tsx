import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import apiurl from "../Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

// FontAwesome ikonları için importlar
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faMobileAlt,
  faCar,
  faHome,
  faLeaf,
  faBasketballBall,
  faBook,
  faTshirt,
  faCouch,
  faUser,
  faPlus,
  faEnvelope,
  faThLarge, // faViewGrid yerine faThLarge kullanıyoruz
  faLaptop,
  faTablet,
  faTv,
  faCarSide,
  faMotorcycle,
  faTruck,
  faMap,
  faBuilding,
  faArrowLeft,
  faShoppingBag,
  faHeart,
  faImage,
  faChevronUp,
  faChevronDown,
  faFilter,
  faStar, // Öne çıkanlar için yıldız ikonu ekleyelim
} from "@fortawesome/free-solid-svg-icons";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  navigation: any; // Daha spesifik bir tip kullanılabilir
}

type Category = {
  id: number;
  name: string;
  icon: string;
  parentId?: number;
};

// Advert tipini güncelleyelim
type Advert = {
  id: string;
  title: string;
  price: number;
  description: string;
  sellerName: string;
  distance: string;
  location: string;
  imageUrl: string;
  images: {
    $values: Array<{ url: string }>;
  };
  categoryId: number;
  carDetail?: {
    bodyType: string;
    brand: string;
    engineSize: number;
    fuelType: string;
    horsePower: number;
    kilometre: number;
    model: string;
    transmission: string;
    year: number;
  };
  km?: number;
  modelYear?: number;
  enginePower?: string;
  engineSize?: string;
  bodyType?: string;
  transmission?: string;
  fuelType?: string;
  userId?: string;
};

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

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState<
    number | "all"
  >("all");
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: "",
    max: "",
  });
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  // Yenileme durumu için yeni state
  const [refreshing, setRefreshing] = useState(false);

  const [allAdverts, setAllAdverts] = useState<Advert[]>([]);

  // Kategori seçimi için state'leri ekleyelim
  const [selectedFilterCategories, setSelectedFilterCategories] = useState<
    number[]
  >([]);
  const [currentFilterLevel, setCurrentFilterLevel] = useState(0);

  // Yeni state'leri ekleyelim
  const [kmRange, setKmRange] = useState<{ min: string; max: string }>({
    min: "",
    max: "",
  });

  const [modelRange, setModelRange] = useState<{ min: string; max: string }>({
    min: "",
    max: "",
  });

  // Yeni state'leri ekleyelim
  const [enginePower, setEnginePower] = useState<string[]>([]);
  const [engineSize, setEngineSize] = useState<string[]>([]);
  const [bodyType, setBodyType] = useState<string>("");
  const [transmission, setTransmission] = useState<string>("");
  const [fuelType, setFuelType] = useState<string>("");

  // İki ayrı state ekleyelim
  const [isEngineSizeExpanded, setIsEngineSizeExpanded] = useState(false);
  const [isEnginePowerExpanded, setIsEnginePowerExpanded] = useState(false);

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

  // Sabit motor hacmi seçeneklerini ekleyelim
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

  // Motor gücü seçeneklerini ekle
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

  // Yeni state ekleyelim
  const [showCategories, setShowCategories] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Component mount olduğunda kullanıcı ID'sini al
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          // Token'dan kullanıcı ID'sini çıkar
          const tokenData = JSON.parse(atob(token.split(".")[1]));
          setCurrentUserId(tokenData.sub);
        }
      } catch (error) {
        console.error("Kullanıcı ID'si alınamadı:", error);
      }
    };
    getCurrentUserId();
  }, []);

  // İlanları getiren fonksiyon
  const fetchAdverts = async (filters?: {
    keyword?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    minKm?: number;
    maxKm?: number;
    minModelYear?: number;
    maxModelYear?: number;
    enginePowers?: string[];
    engineSizes?: string[];
    bodyType?: string;
    transmission?: string;
    fuelType?: string;
    location?: string;
  }) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.error("Token bulunamadı");
        return;
      }

      // Query parametrelerini oluştur
      const queryParams = new URLSearchParams();

      // Tüm filtreleri query parametrelerine ekle
      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(","));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const queryString = queryParams.toString();
      const url = `${apiurl}/api/ad-listings/search${
        queryString ? `?${queryString}` : ""
      }`;

      console.log("API Request URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data.$values)) {
        // İlanları işle ve detayları ekle
        const processedAdverts = data.$values.map((advert: any) => ({
          ...advert,
          images: advert.images || { $values: [] },
          // Araç detaylarını ekle
          km: advert.carDetail?.kilometre,
          modelYear: advert.carDetail?.year,
          enginePower: advert.carDetail?.horsePower?.toString(),
          engineSize: advert.carDetail?.engineSize?.toString(),
          bodyType: advert.carDetail?.bodyType?.toLowerCase(),
          transmission: advert.carDetail?.transmission?.toLowerCase(),
          fuelType: advert.carDetail?.fuelType?.toLowerCase(),
        }));

        console.log("İşlenmiş ilanlar:", processedAdverts);
        setAllAdverts(processedAdverts);
      } else {
        console.error("API'den geçersiz veri formatı:", data);
        setAllAdverts([]);
      }
    } catch (error) {
      console.error("İlanlar yüklenirken hata oluştu:", error);
      setAllAdverts([]);
    }
  };

  // Kategoriye göre ilanları getiren fonksiyon
  const fetchAdvertsByCategory = async (categoryId: number) => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        console.error("Token bulunamadı");
        return;
      }

      const response = await fetch(
        `${apiurl}/api/ad-listings/category/${categoryId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data && Array.isArray(data.$values)) {
        setAllAdverts(data.$values);
      } else {
        console.error("API'den geçersiz veri formatı:", data);
        setAllAdverts([]);
      }
    } catch (error) {
      console.error("Kategori ilanları yüklenirken hata oluştu:", error);
      setAllAdverts([]);
    }
  };

  // Yenileme fonksiyonu
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);

    Promise.all([fetchCategories(), fetchAdverts()]).finally(() => {
      setRefreshing(false);
    });
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchAdverts();
  }, []);

  useEffect(() => {
    // Eğer seçili kategori araç kategorisi (id: 1) ise, araç kategorilerini getir
    if (selectedFilterCategories[0] === 1) {
      fetchAdverts({ categoryId: 1 });
    }
  }, [selectedFilterCategories]);

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

      // Kategorileri düzleştirmek için yardımcı fonksiyon
      const flattenCategories = (
        categories: any[],
        parentId?: number
      ): Category[] => {
        return categories.reduce((acc: Category[], category: any) => {
          // Ana kategoriyi ekle
          const currentCategory: Category = {
            id: category.id,
            name: category.name,
            icon: getIconForCategory(category.id),
            parentId: parentId,
          };

          acc.push(currentCategory);

          // Alt kategorileri varsa onları da ekle
          if (category.children?.$values?.length > 0) {
            acc.push(
              ...flattenCategories(category.children.$values, category.id)
            );
          }

          return acc;
        }, []);
      };

      // Ana kategorileri ve alt kategorileri düzleştir
      const flattenedCategories = flattenCategories(data.$values);
      setCategories(flattenedCategories);
    } catch (error) {
      console.error("Kategoriler yüklenirken hata oluştu:", error);
      // Hata durumunda varsayılan kategorileri ayarla
      setCategories([
        { id: 1, name: "Vasıta", icon: "car" },
        { id: 2, name: "Emlak", icon: "home" },
        { id: 3, name: "Telefon", icon: "cellphone" },
        { id: 4, name: "Elektronik", icon: "laptop" },
        { id: 5, name: "Ev & Yaşam", icon: "sofa" },
        { id: 6, name: "Giyim & Aksesuar", icon: "tshirt-crew" },
        { id: 7, name: "Kişisel Bakım", icon: "flower" },
        { id: 8, name: "Diğer", icon: "view-grid" },
      ]);
    }
  };

  // Kategori ID'sine göre icon belirleme yardımcı fonksiyonu
  const getIconForCategory = (id: number): string => {
    const mainCategoryIcons: { [key: number]: string } = {
      1: "car",
      2: "home",
      3: "cellphone",
      4: "laptop",
      5: "sofa",
      6: "tshirt-crew",
      7: "flower",
      8: "view-grid",
    };

    return mainCategoryIcons[id] || "view-grid";
  };

  // Görüntülenecek kategorileri belirle
  const displayedCategories = useMemo(() => {
    if (selectedMainCategory === "all") {
      return categories.filter((cat) => !cat.parentId);
    }

    return categories.filter((cat) => cat.parentId === selectedCategory);
  }, [selectedMainCategory, selectedCategory, categories]);

  // Geri butonu için fonksiyonu güncelle
  const handleBackButton = async () => {
    try {
      if (selectedCategory !== "all") {
        const currentCategory = categories.find(
          (cat) => cat.id === selectedCategory
        );
        if (currentCategory?.parentId) {
          setSelectedCategory(currentCategory.parentId);
          await fetchCategoryAdverts(currentCategory.parentId);
        } else {
          setSelectedCategory("all");
          setSelectedMainCategory("all");
          await fetchAdverts();
        }
      } else {
        setSelectedMainCategory("all");
        setSelectedCategory("all");
        await fetchAdverts();
      }
    } catch (error) {
      console.error("Geri dönüşte hata oluştu:", error);
    }
  };

  // handleCategorySelect fonksiyonunu da düzenleyelim
  const handleCategorySelect = async (categoryId: number) => {
    try {
      const selectedCat = categories.find((cat) => cat.id === categoryId);
      const hasChildren = categories.some((cat) => cat.parentId === categoryId);

      if (!selectedCat?.parentId) {
        // Ana kategori seçildi
        setSelectedMainCategory(categoryId);
        setSelectedCategory(categoryId);
      } else {
        // Alt kategori seçildi
        setSelectedCategory(categoryId);
      }

      // Her durumda API'ye istek at
      await fetchCategoryAdverts(categoryId);
    } catch (error) {
      console.error("Kategori ilanları yüklenirken hata oluştu:", error);
      setAllAdverts([]);
    }
  };

  // API'den kategori ilanlarını getiren yardımcı fonksiyon
  const fetchCategoryAdverts = async (categoryId: number) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.error("Token bulunamadı");
        return;
      }

      const response = await fetch(
        `${apiurl}/api/ad-listings/category/${categoryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data.$values)) {
        // İlanları işle ve detayları ekle
        const processedAdverts = data.$values.map((advert: any) => ({
          ...advert,
          images: {
            $values: advert.images?.$values || [advert.imageUrl],
          },
          // Araç detaylarını ekle
          km: advert.carDetail?.kilometre,
          modelYear: advert.carDetail?.year,
          enginePower: advert.carDetail?.horsePower?.toString(),
          engineSize: advert.carDetail?.engineSize?.toString(),
          bodyType: advert.carDetail?.bodyType?.toLowerCase(),
          transmission: advert.carDetail?.transmission?.toLowerCase(),
          fuelType: advert.carDetail?.fuelType?.toLowerCase(),
        }));

        console.log("İşlenmiş ilanlar:", processedAdverts); // Debug için
        setAllAdverts(processedAdverts);
      } else {
        console.error("API'den geçersiz veri formatı:", data);
        setAllAdverts([]);
      }
    } catch (error) {
      console.error("Kategori ilanları yüklenirken hata oluştu:", error);
      setAllAdverts([]);
    }
  };

  // filteredAdverts fonksiyonunu güncelleyelim
  const filteredAdverts = useMemo(() => {
    let filtered = allAdverts;
    console.log("Filtreleme başlangıcı - Tüm ilanlar:", filtered);

    // Arama filtresi - sadece arama yapılmışsa uygula
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((advert) => {
        const title = advert.title?.toLowerCase() || "";
        const description = advert.description?.toLowerCase() || "";
        const location = advert.location?.toLowerCase() || "";
        const sellerName = advert.sellerName?.toLowerCase() || "";
        const price = advert.price?.toString().toLowerCase() || "";
        const category = categories.find((cat) => cat.id === advert.categoryId);
        const categoryName = category?.name?.toLowerCase() || "";

        return (
          title.includes(query) ||
          description.includes(query) ||
          location.includes(query) ||
          sellerName.includes(query) ||
          price.includes(query) ||
          categoryName.includes(query)
        );
      });
    }

    // Kategori filtresi - sadece kategori seçilmişse uygula
    if (selectedFilterCategories.length > 0) {
      const lastSelectedCategory =
        selectedFilterCategories[selectedFilterCategories.length - 1];
      // Eğer ana kategori (1) seçiliyse, tüm araç kategorilerini göster
      if (lastSelectedCategory === 1) {
        filtered = filtered.filter((advert) => advert.carDetail !== null);
      } else {
        filtered = filtered.filter(
          (advert) => advert.categoryId === lastSelectedCategory
        );
      }
      console.log("Kategori filtresi sonrası:", filtered);
    }

    // Fiyat aralığı filtresi - sadece min veya max değer girilmişse uygula
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter((advert) => {
        const price = advert.price;
        const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
        const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Araç kategorisi için özel filtreler - sadece seçili filtreleri uygula
    if (selectedFilterCategories[0] === 1) {
      // Kilometre filtresi - sadece min veya max değer girilmişse uygula
      if (kmRange.min || kmRange.max) {
        filtered = filtered.filter((advert) => {
          const km = advert.km || 0;
          const minKm = kmRange.min ? parseInt(kmRange.min) : 0;
          const maxKm = kmRange.max ? parseInt(kmRange.max) : Infinity;
          return km >= minKm && km <= maxKm;
        });
      }

      // Model yılı filtresi - sadece min veya max değer girilmişse uygula
      if (modelRange.min || modelRange.max) {
        filtered = filtered.filter((advert) => {
          const modelYear = advert.modelYear || 0;
          const minYear = modelRange.min ? parseInt(modelRange.min) : 0;
          const maxYear = modelRange.max ? parseInt(modelRange.max) : Infinity;
          return modelYear >= minYear && modelYear <= maxYear;
        });
      }

      // Motor gücü filtresi - sadece seçili değerler varsa uygula
      if (enginePower.length > 0) {
        filtered = filtered.filter((advert) => {
          const advertPower = advert.enginePower?.toString();
          return advertPower && enginePower.includes(advertPower);
        });
      }

      // Motor hacmi filtresi - sadece seçili değerler varsa uygula
      if (engineSize.length > 0) {
        filtered = filtered.filter((advert) => {
          const advertSize = advert.engineSize?.toString();
          return advertSize && engineSize.includes(advertSize);
        });
      }

      // Kasa tipi filtresi - sadece seçili değer varsa uygula
      if (bodyType) {
        console.log("Kasa tipi filtresi uygulanıyor:", bodyType.toLowerCase());
        filtered = filtered.filter((advert) => {
          console.log("İlan kasa tipi:", advert.bodyType);
          return advert.bodyType === bodyType.toLowerCase();
        });
      }

      // Vites tipi filtresi - sadece seçili değer varsa uygula
      if (transmission) {
        filtered = filtered.filter(
          (advert) => advert.transmission === transmission.toLowerCase()
        );
      }

      // Yakıt tipi filtresi - sadece seçili değer varsa uygula
      if (fuelType) {
        filtered = filtered.filter(
          (advert) => advert.fuelType === fuelType.toLowerCase()
        );
      }
    }

    console.log("Filtreleme sonrası:", filtered);
    return filtered;
  }, [
    allAdverts,
    searchQuery,
    selectedFilterCategories,
    categories,
    priceRange,
    kmRange,
    modelRange,
    enginePower,
    engineSize,
    bodyType,
    transmission,
    fuelType,
  ]);

  // Filtreleri uygula
  const applyFilters = () => {
    const filters: any = {};

    if (selectedFilterCategories.length > 0) {
      const lastCategory =
        selectedFilterCategories[selectedFilterCategories.length - 1];
      if (lastCategory === 1) {
        // Ana kategori (Vasıta) seçiliyse, tüm araç ilanlarını getir
        filters.categoryId = 1;
      } else {
        filters.categoryId = lastCategory;
      }
    }

    if (priceRange.min) filters.minPrice = parseInt(priceRange.min);
    if (priceRange.max) filters.maxPrice = parseInt(priceRange.max);
    if (kmRange.min) filters.minKm = parseInt(kmRange.min);
    if (kmRange.max) filters.maxKm = parseInt(kmRange.max);
    if (modelRange.min) filters.minModelYear = parseInt(modelRange.min);
    if (modelRange.max) filters.maxModelYear = parseInt(modelRange.max);
    if (enginePower.length > 0) filters.enginePowers = enginePower;
    if (engineSize.length > 0) filters.engineSizes = engineSize;
    if (bodyType) filters.bodyType = bodyType;
    if (transmission) filters.transmission = transmission;
    if (fuelType) filters.fuelType = fuelType;

    console.log("Uygulanan filtreler:", filters);

    // Önce API'den yeni verileri al
    fetchAdverts(filters).then(() => {
      // API'den veriler geldikten sonra modalı kapat
      setShowFilterModal(false);
    });
  };

  // searchQuery değiştiğinde filtrelemeyi uygula
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        // Önce tüm ilanları getir, sonra istemci tarafında filtrele
        fetchAdverts().then(() => {
          // İlanlar geldiğinde filteredAdverts otomatik olarak güncellenecek
          // çünkü useMemo hook'u allAdverts değiştiğinde yeniden çalışacak
        });
      } else {
        // Arama boşsa ve kategori seçiliyse sadece kategori ilanlarını getir
        if (selectedFilterCategories.length > 0) {
          const lastCategory =
            selectedFilterCategories[selectedFilterCategories.length - 1];
          fetchCategoryAdverts(lastCategory);
        } else {
          // Hiçbir filtre yoksa tüm ilanları getir
          fetchAdverts();
        }
      }
    }, 300); // Debounce süresini 300ms'ye düşürelim

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedFilterCategories]);

  // resetFilters fonksiyonunu güncelleyelim
  const resetFilters = () => {
    setPriceRange({ min: "", max: "" });
    setKmRange({ min: "", max: "" });
    setModelRange({ min: "", max: "" });
    setEnginePower([]);
    setEngineSize([]);
    setBodyType("");
    setTransmission("");
    setFuelType("");
    setSelectedLocation("");
  };

  const renderItem = ({ item }: { item: Advert }) => {
    const imageUrl = item.images?.$values?.[0]?.url;
    const isOwnAdvert = item.userId === currentUserId;

    return (
      <TouchableOpacity
        style={[styles.advertItem, isOwnAdvert && styles.ownAdvertItem]}
        onPress={() => navigation.navigate("Advert", { advertId: item.id })}
      >
        <View style={styles.advertImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.advertImage}
              resizeMode="cover"
              onError={(e) =>
                console.log("Image loading error:", e.nativeEvent.error)
              }
            />
          ) : (
            <View style={styles.defaultImageContainer}>
              <FontAwesomeIcon icon={faImage} size={40} color="#cccccc" />
            </View>
          )}
        </View>
        <View style={styles.advertInfo}>
          <View>
            <Text style={styles.advertTitle} numberOfLines={2}>
              {item.title.toUpperCase()}
            </Text>
            <View style={styles.advertHeader}>
              <View style={styles.priceContainer}>
                <LinearGradient
                  colors={[COLORS.primary, "#00C4B4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.priceGradient}
                >
                  <Text style={styles.advertPrice}>
                    {item.price
                      .toLocaleString("tr-TR", {
                        useGrouping: true,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                      .replace(/,/g, ".")}{" "}
                    ₺
                  </Text>
                </LinearGradient>
                {!isLoadingExchangeRate && exchangeRate && (
                  <>
                    <Text style={styles.priceSeparator}>≈</Text>
                    <LinearGradient
                      colors={["#f0faf9", "#e6f7f5"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.priceGradient}
                    >
                      <Text style={styles.gbpPrice}>
                        £
                        {Number(convertToGBP(item.price)).toLocaleString(
                          "en-GB"
                        )}
                      </Text>
                    </LinearGradient>
                  </>
                )}
              </View>
            </View>
            <Text style={styles.advertDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View style={styles.advertFooter}>
            <View style={styles.sellerInfo}>
              <View style={styles.infoRow}>
                <View
                  style={[
                    styles.infoItem,
                    isOwnAdvert && styles.ownAdvertInfoItem,
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faUser}
                    size={14}
                    color={isOwnAdvert ? "#fff" : COLORS.text.primary}
                  />
                  <Text
                    style={[
                      styles.infoText,
                      isOwnAdvert && styles.ownAdvertInfoText,
                    ]}
                  >
                    {isOwnAdvert
                      ? "Size ait ilan"
                      : item.sellerName || "İsimsiz Satıcı"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity style={styles.categoryItem}>
      <View style={styles.categoryIconContainer}>
        <IconView name={item.icon} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Boş durum bileşenini ekleyelim
  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <FontAwesomeIcon icon={faImage} size={50} color="#cccccc" />
      <Text style={styles.emptyText}>
        Henüz bu kategoride çevrenizde gösterilecek bir ilan bulunmamaktadır
      </Text>
    </View>
  );

  // Filtreleme modalının içeriğini güncelleyelim
  const renderFilterModal = () => {
    // Seçili kategorilerin isimlerini getiren yardımcı fonksiyon
    const getSelectedCategoryPath = () => {
      if (selectedFilterCategories.length === 0) return "";

      return selectedFilterCategories
        .map((categoryId, index) => {
          const categoryList =
            categoryId === 1 || selectedFilterCategories[0] === 1
              ? categories
              : categories;
          const category = categoryList.find((cat) => cat.id === categoryId);
          return category?.name || "";
        })
        .filter(Boolean)
        .join(" > ");
    };

    // Alt kategorileri getiren yardımcı fonksiyon
    const getSubCategories = () => {
      const currentParentId =
        selectedFilterCategories[selectedFilterCategories.length - 1];
      const categoryList = categories;

      // Seçili kategorinin alt kategorilerini filtrele
      const subCategories = categoryList.filter(
        (cat) => cat.parentId === currentParentId
      );

      // Debug için log ekleyelim
      console.log("Current Parent ID:", currentParentId);
      console.log("Category List:", categoryList);
      console.log("Sub Categories:", subCategories);

      return subCategories;
    };

    // Alt kategori kontrolü için yardımcı fonksiyon
    const hasSubCategories = (categoryId: number) => {
      const categoryList = categories;
      return categoryList.some((cat) => cat.parentId === categoryId);
    };

    // Vasıta kategorisi seçili mi kontrolü
    const isVehicleSelected = selectedFilterCategories[0] === 1;

    return (
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            isVehicleSelected && styles.modalOverlayVehicle,
          ]}
        >
          <View
            style={[
              styles.modalContainer,
              isVehicleSelected && styles.modalContainerVehicle,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtreleme Seçenekleri</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Kategori Seçimi */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Kategori</Text>
                {selectedFilterCategories.length > 0 && (
                  <View style={styles.selectedCategoryPath}>
                    <Text style={styles.selectedCategoryPathText}>
                      {getSelectedCategoryPath()}
                    </Text>
                  </View>
                )}
                <View style={styles.categoriesFilterContainer}>
                  {currentFilterLevel === 0 ? (
                    // Ana kategoriler
                    <View style={styles.categoriesGrid}>
                      {categories
                        .filter((cat) => !cat.parentId)
                        .map((category) => (
                          <TouchableOpacity
                            key={`category-${category.id}`}
                            style={[
                              styles.categoryFilterButton,
                              selectedFilterCategories[0] === category.id &&
                                styles.selectedCategoryFilterButton,
                            ]}
                            onPress={() => {
                              setSelectedFilterCategories([category.id]);
                              if (category.id === 1) {
                                // Vasıta kategorisi seçildiğinde hemen fetchVehicleCategories'i çağır
                                fetchAdverts({ categoryId: 1 });
                              } else if (hasSubCategories(category.id)) {
                                setCurrentFilterLevel(1);
                              }
                            }}
                          >
                            <Text
                              style={[
                                styles.categoryFilterText,
                                selectedFilterCategories[0] === category.id &&
                                  styles.selectedCategoryFilterText,
                              ]}
                            >
                              {category.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  ) : (
                    // Alt kategoriler
                    <>
                      <TouchableOpacity
                        style={styles.backFilterButton}
                        onPress={() => {
                          setCurrentFilterLevel(currentFilterLevel - 1);
                          setSelectedFilterCategories((prev) =>
                            prev.slice(0, -1)
                          );
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faArrowLeft}
                          size={16}
                          color="#8adbd2"
                        />
                        <Text style={styles.backFilterText}>Geri</Text>
                      </TouchableOpacity>
                      <View style={styles.categoriesGrid}>
                        {getSubCategories().map((category) => (
                          <TouchableOpacity
                            key={`subcategory-${category.id}`}
                            style={[
                              styles.categoryFilterButton,
                              selectedFilterCategories.includes(category.id) &&
                                styles.selectedCategoryFilterButton,
                            ]}
                            onPress={() => {
                              const newSelectedCategories = [
                                ...selectedFilterCategories,
                                category.id,
                              ];
                              setSelectedFilterCategories(
                                newSelectedCategories
                              );

                              // Alt kategorisi varsa bir sonraki seviyeye geç
                              if (hasSubCategories(category.id)) {
                                setCurrentFilterLevel(currentFilterLevel + 1);
                              }
                            }}
                          >
                            <Text
                              style={[
                                styles.categoryFilterText,
                                selectedFilterCategories.includes(
                                  category.id
                                ) && styles.selectedCategoryFilterText,
                              ]}
                            >
                              {category.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Fiyat Aralığı */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Fiyat Aralığı</Text>
                <View style={styles.priceRangeContainer}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min TL"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={priceRange.min}
                    onChangeText={(text) =>
                      setPriceRange({ ...priceRange, min: text })
                    }
                  />
                  <Text style={styles.priceRangeSeparator}>-</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max TL"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={priceRange.max}
                    onChangeText={(text) =>
                      setPriceRange({ ...priceRange, max: text })
                    }
                  />
                </View>
              </View>

              {/* Vasıta kategorisi seçiliyse ek filtreler */}
              {isVehicleSelected && (
                <>
                  <View style={styles.vehicleFilterHeader}>
                    <View style={styles.vehicleFilterTitleContainer}>
                      <FontAwesomeIcon
                        icon={faCar}
                        size={20}
                        color={COLORS.primary}
                        style={styles.vehicleFilterIcon}
                      />
                      <Text style={styles.vehicleFilterTitle}>
                        Araç ve Motosiklet Filtreleri
                      </Text>
                    </View>
                    <Text style={styles.vehicleFilterSubtitle}>
                      Bu filtreler sadece araç ve motosiklet ilanları için
                      geçerlidir
                    </Text>
                  </View>

                  {/* Kilometre Aralığı */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Kilometre</Text>
                    <View style={styles.priceRangeContainer}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Min KM"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={kmRange.min}
                        onChangeText={(text) =>
                          setKmRange({ ...kmRange, min: text })
                        }
                      />
                      <Text style={styles.priceRangeSeparator}>-</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Max KM"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={kmRange.max}
                        onChangeText={(text) =>
                          setKmRange({ ...kmRange, max: text })
                        }
                      />
                    </View>
                  </View>

                  {/* Model Yılı Aralığı */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Model Yılı</Text>
                    <View style={styles.priceRangeContainer}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Min Yıl"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={modelRange.min}
                        onChangeText={(text) =>
                          setModelRange({ ...modelRange, min: text })
                        }
                      />
                      <Text style={styles.priceRangeSeparator}>-</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Max Yıl"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={modelRange.max}
                        onChangeText={(text) =>
                          setModelRange({ ...modelRange, max: text })
                        }
                      />
                    </View>
                  </View>

                  {/* Motor Gücü */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Motor Gücü</Text>
                    <TouchableOpacity
                      style={[
                        styles.engineSizeCollapsed,
                        enginePower.length > 0 &&
                          styles.engineSizeCollapsedSelected,
                      ]}
                      onPress={() =>
                        setIsEnginePowerExpanded(!isEnginePowerExpanded)
                      }
                    >
                      <Text
                        style={[
                          styles.engineSizeCollapsedText,
                          enginePower.length > 0 &&
                            styles.engineSizeCollapsedTextSelected,
                        ]}
                      >
                        {enginePower.length > 0
                          ? `${enginePower.length} Motor Gücü Seçildi`
                          : "Motor Gücü Seçin"}
                      </Text>
                      <FontAwesomeIcon
                        icon={
                          isEnginePowerExpanded ? faChevronUp : faChevronDown
                        }
                        size={18}
                        color={enginePower.length > 0 ? "#fff" : "#666"}
                      />
                    </TouchableOpacity>

                    {isEnginePowerExpanded && (
                      <ScrollView
                        style={styles.engineSizeContainer}
                        showsVerticalScrollIndicator={true}
                      >
                        {ENGINE_POWERS.map((power) => (
                          <TouchableOpacity
                            key={`power-${power}`}
                            style={[
                              styles.engineSizeButton,
                              enginePower.includes(power) &&
                                styles.selectedOptionButton,
                            ]}
                            onPress={() => {
                              setEnginePower((prev) => {
                                if (prev.includes(power)) {
                                  return prev.filter((item) => item !== power);
                                } else {
                                  return [...prev, power];
                                }
                              });
                            }}
                          >
                            <Text
                              style={[
                                styles.engineSizeText,
                                enginePower.includes(power) &&
                                  styles.selectedOptionText,
                              ]}
                            >
                              {power}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  {/* Motor Hacmi */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Motor Hacmi</Text>
                    <TouchableOpacity
                      style={[
                        styles.engineSizeCollapsed,
                        engineSize.length > 0 &&
                          styles.engineSizeCollapsedSelected,
                      ]}
                      onPress={() =>
                        setIsEngineSizeExpanded(!isEngineSizeExpanded)
                      }
                    >
                      <Text
                        style={[
                          styles.engineSizeCollapsedText,
                          engineSize.length > 0 &&
                            styles.engineSizeCollapsedTextSelected,
                        ]}
                      >
                        {engineSize.length > 0
                          ? `${engineSize.length} Motor Hacmi Seçildi`
                          : "Motor Hacmi Seçin"}
                      </Text>
                      <FontAwesomeIcon
                        icon={
                          isEngineSizeExpanded ? faChevronUp : faChevronDown
                        }
                        size={18}
                        color={engineSize.length > 0 ? "#fff" : "#666"}
                      />
                    </TouchableOpacity>

                    {isEngineSizeExpanded && (
                      <ScrollView
                        style={styles.engineSizeContainer}
                        showsVerticalScrollIndicator={true}
                      >
                        {ENGINE_SIZES.map((size) => (
                          <TouchableOpacity
                            key={`size-${size}`}
                            style={[
                              styles.engineSizeButton,
                              engineSize.includes(size) &&
                                styles.selectedOptionButton,
                            ]}
                            onPress={() => {
                              setEngineSize((prev) => {
                                if (prev.includes(size)) {
                                  return prev.filter((item) => item !== size);
                                } else {
                                  return [...prev, size];
                                }
                              });
                            }}
                          >
                            <Text
                              style={[
                                styles.engineSizeText,
                                engineSize.includes(size) &&
                                  styles.selectedOptionText,
                              ]}
                            >
                              {size}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  {/* Kasa Tipi */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Kasa Tipi</Text>
                    <View style={styles.optionsContainer}>
                      {BODY_TYPES.map((type) => (
                        <TouchableOpacity
                          key={`type-${type}`}
                          style={[
                            styles.optionButton,
                            bodyType === type && styles.selectedOptionButton,
                          ]}
                          onPress={() =>
                            setBodyType(bodyType === type ? "" : type)
                          }
                        >
                          <Text
                            style={[
                              styles.optionText,
                              bodyType === type && styles.selectedOptionText,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Vites */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Vites</Text>
                    <View style={styles.optionsContainer}>
                      {TRANSMISSION_TYPES.map((type) => (
                        <TouchableOpacity
                          key={`transmission-${type}`}
                          style={[
                            styles.optionButton,
                            transmission === type &&
                              styles.selectedOptionButton,
                          ]}
                          onPress={() =>
                            setTransmission(transmission === type ? "" : type)
                          }
                        >
                          <Text
                            style={[
                              styles.optionText,
                              transmission === type &&
                                styles.selectedOptionText,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Yakıt */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Yakıt</Text>
                    <View style={styles.optionsContainer}>
                      {FUEL_TYPES.map((type) => (
                        <TouchableOpacity
                          key={`fuel-${type}`}
                          style={[
                            styles.optionButton,
                            fuelType === type && styles.selectedOptionButton,
                          ]}
                          onPress={() =>
                            setFuelType(fuelType === type ? "" : type)
                          }
                        >
                          <Text
                            style={[
                              styles.optionText,
                              fuelType === type && styles.selectedOptionText,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* Butonlar */}
              <View style={styles.filterButtonsContainer}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    resetFilters();
                    setSelectedFilterCategories([]);
                    setCurrentFilterLevel(0);
                    setKmRange({ min: "", max: "" });
                    setModelRange({ min: "", max: "" });
                    setEnginePower([]);
                    setEngineSize([]);
                    setBodyType("");
                    setTransmission("");
                    setFuelType("");
                  }}
                >
                  <Text style={styles.resetButtonText}>Sıfırla</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyFilters}
                >
                  <Text style={styles.applyButtonText}>Uygula</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

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

  // TL'den GBP'ye çevirme fonksiyonu
  const convertToGBP = (tryAmount: number): string => {
    if (!exchangeRate) return "";
    return Math.ceil(tryAmount * exchangeRate).toString();
  };

  return (
    <LinearGradient
      colors={["#8adbd2", "#f5f5f5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Arama ve Filtreleme Alanı */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Ne aramıştınız?"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCategories(!showCategories)}
          >
            <FontAwesomeIcon
              icon={faThLarge}
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.actionButtonText}>Kategoriler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              /* Öne çıkanları getir */
            }}
          >
            <FontAwesomeIcon icon={faStar} size={18} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Öne Çıkanlar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowFilterModal(true)}
          >
            <FontAwesomeIcon icon={faFilter} size={18} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Filtrele</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Kategoriler - showCategories true ise göster */}
      {showCategories && (
        <View style={styles.categoriesContainer}>
          {(selectedMainCategory !== "all" || selectedCategory !== "all") && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackButton}
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.backButtonText}>
                {selectedCategory !== "all" ? "Geri" : "Ana Kategoriler"}
              </Text>
            </TouchableOpacity>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollView}
          >
            {displayedCategories.map((category) => (
              <TouchableOpacity
                key={`category-${category.id}`}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id &&
                    styles.selectedCategoryItem,
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <View
                  style={[
                    styles.categoryIconContainer,
                    selectedCategory === category.id &&
                      styles.selectedCategoryIconContainer,
                  ]}
                >
                  <IconView
                    name={category.icon}
                    size={26}
                    color={
                      selectedCategory === category.id ? "#fff" : COLORS.primary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.categoryName,
                    selectedCategory === category.id &&
                      styles.selectedCategoryName,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Ana içerik alanı */}
      <View style={styles.mainContent}>
        <FlatList
          data={filteredAdverts}
          renderItem={renderItem}
          keyExtractor={(item, index) => `advert-${item.id}-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={EmptyListComponent}
        />
      </View>

      {/* Filtreleme Modalı */}
      {renderFilterModal()}

      {/* Alt Navigasyon Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <FontAwesomeIcon icon={faUser} size={24} color={COLORS.primary} />
          <Text style={styles.bottomNavText}>Profil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate("MyAds")}
        >
          <FontAwesomeIcon
            icon={faShoppingBag}
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.bottomNavText}>İlanlarım</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddAdvert", { adId: undefined })}
        >
          <FontAwesomeIcon icon={faPlus} size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate("Favs")}
        >
          <FontAwesomeIcon icon={faHeart} size={24} color={COLORS.primary} />
          <Text style={styles.bottomNavText}>Favoriler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate("MessagesArea")}
        >
          <FontAwesomeIcon icon={faEnvelope} size={24} color={COLORS.primary} />
          <Text style={styles.bottomNavText}>Mesajlarım</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dce8e7",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    marginLeft: 12,
  },
  searchIcon: {
    fontSize: 16,
    color: "#666",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(138, 219, 210, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#333",
    marginTop: 4,
    fontWeight: "500",
  },
  categoriesContainer: {
    backgroundColor: "#dce8e7",
    paddingVertical: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  } as ViewStyle,
  categoriesScrollView: {
    paddingHorizontal: 15,
  } as ViewStyle,
  categoryItem: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 12,
    marginRight: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
    fontWeight: "500",
    marginTop: -8,
  } as TextStyle,
  selectedCategoryItem: {
    backgroundColor: COLORS.primary,
  },
  selectedCategoryIconContainer: {
    backgroundColor: COLORS.primary,
  },
  selectedCategoryName: {
    color: "#fff",
    fontWeight: "600",
  } as TextStyle,
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  } as ViewStyle,
  backButtonText: {
    marginLeft: 8,
    color: "#8adbd2",
    fontSize: 14,
    fontWeight: "600",
  } as TextStyle,
  listContainer: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 80,
  },
  advertItem: {
    flexDirection: "row",
    backgroundColor: "#dce8e7",
    borderRadius: 20,
    marginHorizontal: 12,
    marginVertical: 8,
    marginTop: 12,
    width: "95%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    alignItems: "stretch",
    height: 140,
    overflow: "hidden",
  },
  ownAdvertItem: {
    backgroundColor: "#f0faf9",
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  advertImageContainer: {
    width: 120,
    height: "100%",
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
    padding: 12,
    justifyContent: "space-between",
    height: "100%",
  },
  advertHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  advertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceGradient: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  advertPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  gbpPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  advertDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  advertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sellerInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "column",
    gap: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  ownAdvertInfoItem: {
    backgroundColor: COLORS.primary,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 6,
    fontWeight: "500",
  },
  ownAdvertInfoText: {
    color: "#fff",
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingBottom: 10,
  },
  footerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  footerButtonText: {
    fontSize: 12,
    marginTop: 4,
    color: "#333",
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ translateY: -20 }],
    marginBottom: 30,
  },
  addButtonText: {
    fontSize: 10,
    color: "white",
    marginTop: 2,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0faf9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  filterButtonText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "500",
  },

  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
  },
  modalOverlayVehicle: {
    justifyContent: "center", // Vasıta seçildiğinde modalı ortala
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 20,
    maxHeight: "90%",
    marginTop: 50,
  },
  modalContainerVehicle: {
    marginTop: 0,
    borderRadius: 20,
    maxHeight: "85%",
    marginHorizontal: 15,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    fontSize: 20,
    color: "#999",
  },
  modalContent: {
    padding: 15,
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  priceRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#fff",
  },
  priceRangeSeparator: {
    marginHorizontal: 10,
    fontSize: 16,
    color: "#666",
  },
  locationButton: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedLocationButton: {
    backgroundColor: "#8adbd2",
  },
  selectedLocationButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  filterButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  selectedCategoryPath: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    marginBottom: 15,
  },
  selectedCategoryPathText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  fullWidthInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
  },

  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    marginHorizontal: -5,
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

  engineSizeCollapsed: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    height: 56,
  },

  engineSizeCollapsedSelected: {
    backgroundColor: "#8adbd2",
  },

  engineSizeCollapsedText: {
    fontSize: 15,
    color: "#333",
  },

  engineSizeCollapsedTextSelected: {
    color: "#fff",
    fontWeight: "500",
  },

  engineSizeContainer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginTop: 8,
  },

  engineSizeButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },

  engineSizeText: {
    fontSize: 16,
    color: "#333",
    textAlign: "left",
  },

  placeholderText: {
    color: "#999",
  },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 0,
    height: 70,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomNavItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    minWidth: 65,
  } as ViewStyle,
  bottomNavText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 15,
    lineHeight: 24,
  },
  mainContent: {
    flex: 1,
    marginBottom: 60,
    backgroundColor: "transparent",
  },
  categoriesFilterContainer: {
    marginTop: 10,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  categoryFilterButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    margin: 5,
    minWidth: "30%",
  },
  selectedCategoryFilterButton: {
    backgroundColor: "#8adbd2",
    borderColor: "#8adbd2",
  },
  categoryFilterText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  selectedCategoryFilterText: {
    color: "#fff",
    fontWeight: "bold",
  },
  backFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 10,
  },
  backFilterText: {
    marginLeft: 8,
    color: "#8adbd2",
    fontSize: 14,
    fontWeight: "500",
  },
  defaultImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  filterSectionSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: -8,
    marginBottom: 15,
    fontStyle: "italic",
  },
  vehicleFilterHeader: {
    backgroundColor: "#f0faf9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  vehicleFilterTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  vehicleFilterIcon: {
    marginRight: 10,
  },
  vehicleFilterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  vehicleFilterSubtitle: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginLeft: 30,
  },
  ownAdvertBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ownAdvertGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ownAdvertIcon: {
    marginRight: 6,
  },
  ownAdvertText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  priceSeparator: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
});

// İlan Ver butonu için özel + ikonu bileşeni
const PlusIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ alignItems: "center", justifyContent: "center" }}>
    <View
      style={{
        width: size * 0.6,
        height: 2,
        backgroundColor: color,
        position: "absolute",
      }}
    />
    <View
      style={{
        width: 2,
        height: size * 0.6,
        backgroundColor: color,
        position: "absolute",
      }}
    />
  </View>
);

// IconView bileşenini güncelle
const IconView = ({
  name,
  size,
  color,
}: {
  name: string;
  size: number;
  color: string;
}) => {
  // FontAwesome ikonlarını kullan
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "cellphone":
        return faMobileAlt;
      case "car":
        return faCar;
      case "home":
        return faHome;
      case "flower":
        return faLeaf;
      case "basketball":
        return faBasketballBall;
      case "book-open-variant":
        return faBook;
      case "tshirt-crew":
        return faTshirt;
      case "sofa":
        return faCouch;
      case "account":
        return faUser;
      case "message-text":
        return faEnvelope;
      case "view-grid":
        return faThLarge;
      case "plus":
        return faPlus;
      case "laptop":
        return faLaptop;
      case "tablet":
        return faTablet;
      case "television":
        return faTv;
      case "car-side":
        return faCarSide;
      case "motorcycle":
        return faMotorcycle;
      case "truck":
        return faTruck;
      case "map":
        return faMap;
      case "office-building":
        return faBuilding;
      default:
        return faThLarge;
    }
  };

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <FontAwesomeIcon icon={getIcon(name)} size={size * 0.7} color={color} />
    </View>
  );
};

export default HomeScreen;
