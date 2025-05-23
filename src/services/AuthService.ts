import TokenService from './TokenService';
import apiurl from '../Apiurl';

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

class AuthService {
  // ... mevcut kodlar ...

  static async register(userData: RegisterData): Promise<void> {
    try {
      const response = await fetch(`${apiurl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Kayıt işlemi başarısız oldu');
      }

      // Kayıt başarılı olduğunda gelen token'ı kaydet
      if (data.token) {
        await TokenService.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('Kayıt olurken hata oluştu:', error);
      throw error;
    }
  }

  // ... diğer metodlar ...
}

export default AuthService; 