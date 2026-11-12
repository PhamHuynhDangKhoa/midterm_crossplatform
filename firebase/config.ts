import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  initializeAuth,
  // @ts-expect-error getReactNativePersistence is provided by @firebase/auth RN bundle
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyD4Zczu2yWA5WjS_HmaeNO-V1W2bFpSqNc",
  authDomain: "qlhocphan-84fb.firebaseapp.com",
  projectId: "qlhocphan-84fb",
  storageBucket: "qlhocphan-84fb.firebasestorage.app",
  messagingSenderId: "48169439394",
  appId: "1:48169439394:web:0d53a8c74f9d73aac287fb",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth: Auth =
  Platform.OS === "web"
    ? getAuth(app)
    : (() => {
        try {
          return initializeAuth(
            app,
            typeof getReactNativePersistence === "function"
              ? { persistence: getReactNativePersistence(AsyncStorage) }
              : undefined,
          );
        } catch {
          return getAuth(app);
        }
      })();

const db = getFirestore(app);

export { app, auth, db };
