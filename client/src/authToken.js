export const FIREBASE_ID_TOKEN_KEY = "pricepilot.firebaseIdToken";
export const FIREBASE_USER_KEY = "pricepilot.firebaseUser";

export function storeAuthSession(user, token) {
  localStorage.setItem(FIREBASE_ID_TOKEN_KEY, token);
  localStorage.setItem(
    FIREBASE_USER_KEY,
    JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    })
  );
}

export function clearAuthSession() {
  localStorage.removeItem(FIREBASE_ID_TOKEN_KEY);
  localStorage.removeItem(FIREBASE_USER_KEY);
}

export function getStoredFirebaseIdToken() {
  return localStorage.getItem(FIREBASE_ID_TOKEN_KEY);
}
