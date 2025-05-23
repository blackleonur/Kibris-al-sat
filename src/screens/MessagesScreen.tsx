import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Linking,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../Types";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faPaperPlane,
  faImage,
  faLocationDot,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";
import apiurl from "../Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import WebView from "react-native-webview";
import TokenService from "../services/TokenService";
import { LinearGradient } from "expo-linear-gradient";

type MessagesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Messages"
>;

type MessagesScreenRouteProp = RouteProp<RootStackParamList, "Messages">;

type Props = {
  navigation: MessagesScreenNavigationProp;
  route: MessagesScreenRouteProp;
};

type ChatMessage = {
  id: string;
  text: string;
  time: string;
  displayTime: string;
  isMe: boolean;
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  senderId: string;
};

const MessagesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId: advertOwnerId, userName } = route.params;
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // İlk olarak kullanıcı ID'sini al
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const userId = await TokenService.getUserId();
        console.log("TokenService'den alınan kullanıcı ID:", userId);
        if (userId) {
          setCurrentUserId(userId);
        } else {
          console.error("Kullanıcı ID alınamadı!");
        }
      } catch (error) {
        console.error("Kullanıcı ID alınırken hata:", error);
      }
    };
    initializeUser();
  }, []);

  // currentUserId değiştiğinde mesajları getir
  useEffect(() => {
    if (currentUserId) {
      fetchMessages();
    }
  }, [currentUserId]);

  // Her 5 saniyede bir mesajları güncelle
  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const fetchMessages = async () => {
    if (!currentUserId) {
      console.log("currentUserId henüz hazır değil, mesajlar getirilmiyor");
      return;
    }

    try {
      const token = await TokenService.getToken();
      if (!token) {
        throw new Error("Oturum açmanız gerekiyor");
      }

      const response = await fetch(`${apiurl}/api/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Mesajlar yüklenemedi");
      }

      const data = await response.json();
      console.log("API'den gelen mesajlar:", data.$values);

      // API'den gelen mesajları ChatMessage formatına dönüştür
      const formattedMessages: ChatMessage[] = data.$values.map((msg: any) => {
        // Mesajın gönderen veya alıcı ID'si ile mevcut kullanıcının ID'sini karşılaştır
        const isCurrentUserSender = msg.senderId === currentUserId;
        const isCurrentUserReceiver = msg.receiverId === currentUserId;

        console.log("Mesaj detayları:", {
          mesajGonderenId: msg.senderId,
          mesajAliciId: msg.receiverId,
          mevcutKullaniciId: currentUserId,
          gonderenMi: isCurrentUserSender,
          aliciMi: isCurrentUserReceiver,
          mesajIcerigi: msg.content,
        });

        return {
          id: msg.id.toString(),
          text: msg.content,
          time: msg.timestamp,
          displayTime: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMe: isCurrentUserSender, // Eğer gönderen biz isek sağda göster
          senderId: msg.senderId,
        };
      });

      // Mesajları tarihe göre sırala (en yeni mesaj en altta)
      const sortedMessages = formattedMessages.sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );

      setMessages(sortedMessages);

      // En son mesaja scroll yap
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error("Mesajları getirme hatası:", error);
      alert("Mesajlar yüklenirken bir hata oluştu");
    }
  };

  const sendMessage = async () => {
    if (message.trim() === "" || !currentUserId) return;

    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      const token = await TokenService.getToken();
      if (!token) {
        throw new Error("Oturum açmanız gerekiyor");
      }

      const response = await fetch(`${apiurl}/api/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: advertOwnerId,
          content: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Mesaj gönderilemedi");
      }

      // Mesaj başarıyla gönderildiyse UI'ı güncelle
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message,
        time: currentTime,
        displayTime: currentTime,
        isMe: true,
        senderId: currentUserId,
      };

      // Yeni mesajı listenin sonuna ekle
      setMessages([...messages, newMessage]);
      setMessage("");

      // En son mesaja scroll yap
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Mesaj gönderilemedi. Lütfen tekrar deneyin."
      );
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        alert("Fotoğraf seçmek için izin gerekiyor!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });

      console.log("Seçilen görsel:", result);

      if (!result.canceled && result.assets[0]) {
        await sendImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Fotoğraf seçme hatası:", error);
      alert("Fotoğraf seçilirken bir hata oluştu");
    }
  };

  const sendImage = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    try {
      const token = await TokenService.getToken();
      if (!token || !currentUserId) {
        throw new Error("Oturum açmanız gerekiyor");
      }

      // Fotoğrafı FormData olarak hazırla
      const formData = new FormData();

      // Dosya tipini belirle
      let fileType = "image/jpeg";
      if (imageAsset.uri.endsWith(".png")) {
        fileType = "image/png";
      }

      formData.append("file", {
        uri:
          Platform.OS === "ios"
            ? imageAsset.uri.replace("file://", "")
            : imageAsset.uri,
        type: fileType,
        name: `photo.${fileType.split("/")[1]}`,
      } as any);

      console.log("Gönderilecek formData:", formData);

      const response = await fetch(`${apiurl}/api/messages/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Fotoğraf gönderilemedi");
      }

      const responseData = await response.json();
      console.log("Dönen response:", responseData);

      const imageUrl = responseData.imageUrl;

      // Fotoğraf mesajını UI'a ekle
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "📷 Fotoğraf",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        displayTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: true,
        imageUrl: imageUrl,
        senderId: currentUserId,
      };

      setMessages([...messages, newMessage]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Fotoğraf gönderme hatası:", error);
      alert(error instanceof Error ? error.message : "Fotoğraf gönderilemedi");
    }
  };

  const sendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Konum paylaşmak için izin gerekiyor!");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const token = await TokenService.getToken();
      if (!token || !currentUserId) {
        throw new Error("Oturum açmanız gerekiyor");
      }

      // OpenStreetMap URL'ini oluştur
      const mapImageUrl = `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${longitude},${latitude}&z=15&l=map&size=450,450&pt=${longitude},${latitude},pm2rdm`;

      const response = await fetch(`${apiurl}/api/messages/send-location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: advertOwnerId,
          latitude,
          longitude,
          message: "📍 Konum paylaşıldı",
        }),
      });

      if (!response.ok) {
        throw new Error("Konum gönderilemedi");
      }

      // UI'a konum mesajını ekle
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "📍 Konum",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        displayTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: true,
        imageUrl: mapImageUrl,
        location: { latitude, longitude },
        senderId: currentUserId,
      };

      setMessages([...messages, newMessage]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Konum gönderme hatası:", error);
      alert("Konum paylaşılırken bir hata oluştu");
    }
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleLocationPress = (location: {
    latitude: number;
    longitude: number;
  }) => {
    setSelectedLocation(location);
  };

  const handleGetDirections = () => {
    if (!selectedLocation) return;

    const url = Platform.select({
      ios: `maps:${selectedLocation.latitude},${selectedLocation.longitude}`,
      android: `geo:${selectedLocation.latitude},${selectedLocation.longitude}?q=${selectedLocation.latitude},${selectedLocation.longitude}`,
    });

    if (url) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            alert("Harita uygulaması bulunamadı");
          }
        })
        .catch((err) => console.error("Harita açma hatası:", err));
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isMe ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isMe ? styles.myMessageBubble : styles.theirMessageBubble,
        ]}
      >
        {item.imageUrl && (
          <TouchableOpacity
            onPress={() =>
              item.location
                ? handleLocationPress(item.location)
                : handleImagePress(item.imageUrl!)
            }
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={item.location ? styles.mapImage : styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        <Text
          style={[
            styles.messageText,
            item.isMe ? styles.myMessageText : styles.theirMessageText,
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            item.isMe ? styles.myMessageTime : styles.theirMessageTime,
          ]}
        >
          {item.displayTime}
        </Text>
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#8adbd2" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{userName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <FontAwesomeIcon icon={faEllipsisV} size={20} color="#8adbd2" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={styles.keyboardView}
      >
        <LinearGradient
          colors={["#fff", "#f8f8f8"]}
          style={styles.inputBackground}
        >
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
              <FontAwesomeIcon icon={faImage} size={25} color="#8adbd2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={sendLocation}
            >
              <FontAwesomeIcon icon={faLocationDot} size={25} color="#8adbd2" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Mesaj yazın..."
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                message.trim() === "" && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={message.trim() === ""}
            >
              <FontAwesomeIcon
                icon={faPaperPlane}
                size={25}
                color={message.trim() === "" ? "#8adbd2" : "#8adbd2"}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>

      <Modal
        visible={selectedImage !== null}
        transparent={true}
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
              onLoad={(e) => {
                const { width, height } = e.nativeEvent.source;
                const aspectRatio = width / height;
                e.currentTarget.setNativeProps({
                  style: {
                    ...styles.fullScreenImage,
                    aspectRatio,
                  },
                });
              }}
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={selectedLocation !== null}
        transparent={true}
        onRequestClose={() => setSelectedLocation(null)}
      >
        <View style={styles.locationModalContainer}>
          <View style={styles.locationModalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedLocation(null)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            {selectedLocation && (
              <>
                <View style={styles.mapContainer}>
                  <WebView
                    style={styles.fullScreenMap}
                    source={{
                      html: `
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
                            <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
                            <style>
                              body { margin: 0; }
                              #map { height: 100vh; width: 100vw; }
                            </style>
                          </head>
                          <body>
                            <div id="map"></div>
                            <script>
                              var map = L.map('map').setView([${selectedLocation.latitude}, ${selectedLocation.longitude}], 15);
                              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                attribution: '© OpenStreetMap contributors'
                              }).addTo(map);
                              L.marker([${selectedLocation.latitude}, ${selectedLocation.longitude}]).addTo(map);
                            </script>
                          </body>
                        </html>
                      `,
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={handleGetDirections}
                >
                  <Text style={styles.directionsButtonText}>Yol Tarifi Al</Text>
                </TouchableOpacity>
              </>
            )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "ios" ? 15 : 15,
    marginTop: Platform.OS === "ios" ? 45 : 10,
    marginHorizontal: 10,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
    marginBottom: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginLeft: 10,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8adbd2",
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  headerButton: {
    padding: 5,
    marginLeft: 10,
    marginBottom: 2,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    marginBottom: 8,
    flexDirection: "row",
  },
  myMessage: {
    justifyContent: "flex-end",
  },
  theirMessage: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: "#8adbd2",
    borderBottomRightRadius: 5,
  },
  theirMessageBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#eee",
  },
  messageText: {
    fontSize: 16,
    marginBottom: 5,
  },
  myMessageText: {
    color: "#fff",
  },
  theirMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 12,
    alignSelf: "flex-end",
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  theirMessageTime: {
    color: "#999",
  },
  keyboardView: {
    backgroundColor: "transparent",
  },
  inputBackground: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingBottom: Platform.OS === "ios" ? 0 : 0,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  attachButton: {
    padding: 8,
    marginRight: 5,
  },
  locationButton: {
    padding: 8,
    marginRight: 5,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sendButton: {
    backgroundColor: "transparent",
    width: 45,
    height: 45,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  messageImage: {
    width: 200,
    height: 160,
    borderRadius: 10,
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  fullScreenImage: {
    width: "100%",
    height: "90%",
    aspectRatio: undefined,
  },
  modalCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  modalCloseText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  mapImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 5,
  },
  locationModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  locationModalContent: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  mapContainer: {
    width: "100%",
    height: "90%",
    overflow: "hidden",
  },
  fullScreenMap: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  directionsButton: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "#8adbd2",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  directionsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MessagesScreen;
