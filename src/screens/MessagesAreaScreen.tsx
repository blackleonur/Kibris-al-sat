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
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../Types";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faSearch,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";
import apiurl from "../Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";

type MessagesAreaScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MessagesArea"
>;

type Props = {
  navigation: MessagesAreaScreenNavigationProp;
};

type Message = {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  lastMessage: string;
  time: string;
  unread: boolean;
};

const MessagesAreaScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(`${apiurl}/api/messages/conversations`, {
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

      const conversations = data.$values || [];

      // Mesajları kullanıcılara göre grupla ve son mesajı al
      const lastMessagesByUser = new Map();

      conversations.forEach((item: any) => {
        const otherUserId = item.senderId;
        const currentMessage = {
          timestamp: new Date(item.timestamp),
          message: item,
        };

        if (
          !lastMessagesByUser.has(otherUserId) ||
          new Date(lastMessagesByUser.get(otherUserId).timestamp) <
            currentMessage.timestamp
        ) {
          lastMessagesByUser.set(otherUserId, currentMessage);
        }
      });

      const formattedMessages: Message[] = Array.from(
        lastMessagesByUser.values()
      ).map(({ message }) => ({
        id: message.id?.toString(),
        sender: {
          id: message.senderId,
          name: "Kullanıcı " + message.senderId.substring(0, 5),
          avatar: `https://ui-avatars.com/api/?name=${message.senderId.substring(
            0,
            2
          )}&background=random`,
        },
        lastMessage: message.content || "Mesaj yok",
        time: formatMessageTime(message.timestamp),
        unread: false,
      }));

      // Mesajları tarihe göre sırala (en yeni en üstte)
      formattedMessages.sort((a, b) => {
        const dateA = new Date(a.time);
        const dateB = new Date(b.time);
        return dateB.getTime() - dateA.getTime();
      });

      console.log("Son mesajlar:", formattedMessages);
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Mesajlar yüklenirken hata detayı:", error);
      setMessages([]);
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

  const renderItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() =>
        navigation.navigate("Messages", {
          userId: item.sender.id,
          userName: item.sender.name,
        })
      }
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.sender.avatar }} style={styles.avatar} />
        {item.unread && <View style={styles.unreadBadge} />}
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>{item.sender.name}</Text>
          <Text style={styles.messageTime}>{item.time}</Text>
        </View>
        <Text
          style={[styles.lastMessage, item.unread && styles.unreadMessage]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <FontAwesomeIcon icon={faSearch} size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <FontAwesomeIcon icon={faEllipsisV} size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8adbd2" />
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          refreshing={loading}
          onRefresh={fetchMessages}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerRight: {
    flexDirection: "row",
  },
  headerButton: {
    padding: 5,
    marginLeft: 15,
  },
  messagesList: {
    paddingVertical: 10,
  },
  messageItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#8adbd2",
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
  unreadMessage: {
    fontWeight: "bold",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MessagesAreaScreen;
