import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string;
  name: string;
  email: string;
  jti: string;
  exp: number;
  iss: string;
  aud: string;
}

class TokenService {
  private static readonly TOKEN_KEY = "userToken";
  private static readonly USER_DATA_KEY = "userData";

  // Token'ı kaydet
  static async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TOKEN_KEY, token);

      // Token'ı decode et ve kullanıcı bilgilerini kaydet
      const decodedToken = this.decodeToken(token);
      if (decodedToken) {
        await AsyncStorage.setItem(
          this.USER_DATA_KEY,
          JSON.stringify(decodedToken)
        );
      }
    } catch (error) {
      console.error("Token kaydedilirken hata oluştu:", error);
      throw error;
    }
  }

  // Token'ı getir
  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error("Token alınırken hata oluştu:", error);
      return null;
    }
  }

  // Token'ı sil (çıkış yaparken)
  static async removeToken(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.TOKEN_KEY, this.USER_DATA_KEY]);
    } catch (error) {
      console.error("Token silinirken hata oluştu:", error);
      throw error;
    }
  }

  // Token'ı decode et
  static decodeToken(token: string): DecodedToken | null {
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error("Token decode edilirken hata oluştu:", error);
      return null;
    }
  }

  // Kullanıcı bilgilerini getir
  static async getUserData(): Promise<DecodedToken | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Kullanıcı bilgileri alınırken hata oluştu:", error);
      return null;
    }
  }

  // Token'ın geçerlilik süresini kontrol et
  static async isTokenValid(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) return false;

      const decodedToken = this.decodeToken(token);
      if (!decodedToken) return false;

      // Token'ın süresi dolmuş mu kontrol et
      const currentTime = Math.floor(Date.now() / 1000);
      return decodedToken.exp > currentTime;
    } catch (error) {
      console.error("Token geçerliliği kontrol edilirken hata oluştu:", error);
      return false;
    }
  }

  // Kullanıcı ID'sini getir
  static async getUserId(): Promise<string | null> {
    try {
      const userData = await this.getUserData();
      return userData?.sub || null;
    } catch (error) {
      console.error("Kullanıcı ID alınırken hata oluştu:", error);
      return null;
    }
  }

  // Kullanıcı adını getir
  static async getUserName(): Promise<string | null> {
    try {
      const userData = await this.getUserData();
      return userData?.name || null;
    } catch (error) {
      console.error("Kullanıcı adı alınırken hata oluştu:", error);
      return null;
    }
  }

  // Kullanıcı emailini getir
  static async getUserEmail(): Promise<string | null> {
    try {
      const userData = await this.getUserData();
      return userData?.email || null;
    } catch (error) {
      console.error("Kullanıcı email alınırken hata oluştu:", error);
      return null;
    }
  }
}

export default TokenService;
