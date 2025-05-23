import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faEnvelope,
  faPhone,
  faQuestionCircle,
  faBook,
  faComments,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

type HelpScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Help"
>;

type Props = {
  navigation: HelpScreenNavigationProp;
};

type FAQItem = {
  question: string;
  answer: string;
};

const faqData: FAQItem[] = [
  {
    question: "İlan nasıl oluşturabilirim?",
    answer:
      "İlan oluşturmak için ana sayfadaki '+' butonuna tıklayın ve gerekli bilgileri doldurun. Fotoğraf ekleyip fiyat belirledikten sonra ilanınızı yayınlayabilirsiniz.",
  },
  {
    question: "İlanımı nasıl düzenleyebilirim?",
    answer:
      "Profilim > İlanlarım bölümünden ilgili ilanı bulup düzenleme ikonuna tıklayarak ilanınızı güncelleyebilirsiniz.",
  },
  {
    question: "Favorilere nasıl eklerim?",
    answer:
      "İlan detay sayfasındaki kalp ikonuna tıklayarak ilgili ilanı favorilerinize ekleyebilirsiniz.",
  },
  {
    question: "Satıcıyla nasıl iletişime geçebilirim?",
    answer:
      "İlan detay sayfasındaki 'Mesaj Gönder' butonunu kullanarak satıcıyla özel mesajlaşma başlatabilirsiniz.",
  },
];

const HelpScreen: React.FC<Props> = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleContact = (type: string) => {
    switch (type) {
      case "email":
        Linking.openURL("mailto:destek@kibris.com").catch(() => {
          Alert.alert("Hata", "E-posta uygulaması açılamadı");
        });
        break;
      case "phone":
        Linking.openURL("tel:+903921234567").catch(() => {
          Alert.alert("Hata", "Telefon uygulaması açılamadı");
        });
        break;
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sık Sorulan Sorular</Text>
        {faqData.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqItem}
            onPress={() => toggleFaq(index)}
          >
            <View style={styles.faqHeader}>
              <FontAwesomeIcon
                icon={faQuestionCircle}
                size={20}
                color="#8adbd2"
              />
              <Text style={styles.faqQuestion}>{faq.question}</Text>
            </View>
            {expandedFaq === index && (
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yardım Kategorileri</Text>
        <TouchableOpacity style={styles.helpItem}>
          <FontAwesomeIcon icon={faBook} size={20} color="#8adbd2" />
          <Text style={styles.helpItemText}>Kullanım Kılavuzu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpItem}>
          <FontAwesomeIcon icon={faComments} size={20} color="#8adbd2" />
          <Text style={styles.helpItemText}>Mesajlaşma Kuralları</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpItem}>
          <FontAwesomeIcon
            icon={faExclamationCircle}
            size={20}
            color="#8adbd2"
          />
          <Text style={styles.helpItemText}>Güvenli Alışveriş</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bize Ulaşın</Text>
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => handleContact("email")}
        >
          <FontAwesomeIcon icon={faEnvelope} size={20} color="#8adbd2" />
          <Text style={styles.contactItemText}>destek@kibris.com</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => handleContact("phone")}
        >
          <FontAwesomeIcon icon={faPhone} size={20} color="#8adbd2" />
          <Text style={styles.contactItemText}>+90 392 123 45 67</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Çalışma Saatlerimiz: Pazartesi - Cumartesi 09:00 - 18:00
        </Text>
        <Text style={styles.infoText}>
          E-postalarınıza en geç 24 saat içinde yanıt veriyoruz.
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
  faqItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 15,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    marginLeft: 35,
    lineHeight: 20,
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  helpItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contactItemText: {
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
    marginBottom: 5,
    textAlign: "center",
  },
});

export default HelpScreen;
