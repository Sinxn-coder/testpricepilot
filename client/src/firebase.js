import { initializeApp, getApp, getApps } from "@firebase/app";
import { getAuth, GoogleAuthProvider } from "@firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA-PbcvN6FJ8rQ0UlmD4TxowvywfMGNWUI",
  authDomain: "pricepilot-project.firebaseapp.com",
  projectId: "pricepilot-project",
  storageBucket: "pricepilot-project.firebasestorage.app",
  messagingSenderId: "984013274648",
  appId: "1:984013274648:web:ddeb93f41baff6b115cd6d",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

export default app;
