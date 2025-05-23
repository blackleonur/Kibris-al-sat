export type RootStackParamList = {
  SplashScreen: undefined;
  Home: undefined;
  Advert: {
    advertId: string | number;
  };
  GuestHomeScreen: undefined;
  RegisterScreen: undefined;
  VerificationScreen: {
    userData: {
      fullName: string;
      email: string;
      phoneNumber: string;
      password: string;
    };
    expiresIn?: number;
  };
  Profile: undefined;
  MessagesArea: undefined;
  Messages: { userId: string; userName: string };
  AddAdvert: { adId?: number };
  PersonalInfo: {
    email: string;
    phoneNumber: string;
  };
  Favs: undefined;
  MyAds: undefined;
  Privacy: undefined;
  Help: undefined;
  EditAd: { adId: number };
  AppSettings: undefined;
  // ... diğer route'lar
};

export type Advert = {
  id: string | number;
  title: string;
  description: string;
  price: number;
  sellerName: string;
  distance: string;
  location: string;
  category: string;
  imageUrls: {
    $values: string[];
  };
  latitude: number;
  longitude: number;
  status: string;
  address: string;
  categoryName: string;
};

export type Conversation = {
  userId: string;
  lastMessage: string;
  lastMessageTime: string;
  user: {
    id: string;
    fullName: string;
    profilePictureUrl: string | null;
  };
};
