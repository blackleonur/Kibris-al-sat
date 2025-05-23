import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, Conversation } from "../Types";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faSearch,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";
import apiurl from "../Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

type MessagesAreaScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MessagesArea"
>;

type Props = {
  navigation: MessagesAreaScreenNavigationProp;
};

const MessagesAreaScreen: React.FC<Props> = ({ navigation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  // 4 saniyede bir mesajları yenile
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(`${apiurl}/api/messages/conversation-list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Mesajlar yüklenirken bir hata oluştu");
      }

      const conversationList = data.$values || [];
      setConversations(conversationList);
    } catch (error) {
      console.error("Mesajlar yüklenirken hata detayı:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return messageDate.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays === 1) {
      return "Dün";
    } else if (diffInDays < 7) {
      return messageDate.toLocaleDateString("tr-TR", { weekday: "long" });
    } else {
      return messageDate.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "numeric",
      });
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() =>
        navigation.navigate("Messages", {
          userId: item.user.id,
          userName: item.user.fullName,
        })
      }
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri:
              item.user.profilePictureUrl ||
              `https://ui-avatars.com/api/?name=${item.user.fullName}&background=random`,
          }}
          style={styles.avatar}
        />
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>{item.user.fullName}</Text>
          <Text style={styles.messageTime}>
            {formatMessageTime(item.lastMessageTime)}
          </Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Mesajlar</Text>
          <Text style={styles.headerSubtitle}>Tüm konuşmalarınız burada</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <FontAwesomeIcon icon={faSearch} size={20} color="#8adbd2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <FontAwesomeIcon icon={faEllipsisV} size={20} color="#8adbd2" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8adbd2" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={styles.messagesList}
          refreshing={loading}
          onRefresh={fetchConversations}
        />
      )}
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
    paddingVertical: 12,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "ios" ? 15 : 15,
    marginTop: Platform.OS === "ios" ? 45 : 30,
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
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginLeft: 10,
    justifyContent: "center",
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8adbd2",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  headerButton: {
    padding: 5,
    marginLeft: 15,
    marginBottom: 2,
  },
  messagesList: {
    paddingVertical: 10,
  },
  messageItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginVertical: 5,
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
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#fff",
  },
  messageContent: {
    flex: 1,
    justifyContent: "center",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  senderName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  messageTime: {
    fontSize: 12,
    color: "#999",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MessagesAreaScreen;
