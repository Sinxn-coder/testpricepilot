const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const env = require("./env");

function parseServiceAccountJson(rawJson) {
  try {
    return JSON.parse(rawJson);
  } catch (error) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
}

function loadServiceAccount() {
  if (env.firebaseServiceAccountJson) {
    return parseServiceAccountJson(env.firebaseServiceAccountJson);
  }

  if (env.firebaseServiceAccountPath) {
    const serviceAccountPath = path.resolve(process.cwd(), env.firebaseServiceAccountPath);

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Firebase service account file not found: ${serviceAccountPath}`);
    }

    return parseServiceAccountJson(fs.readFileSync(serviceAccountPath, "utf8"));
  }

  return null;
}

function getFirebaseAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccount = loadServiceAccount();

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: env.firebaseProjectId || serviceAccount.project_id,
    });
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: env.firebaseProjectId,
  });
}

function getFirebaseAuth() {
  return getFirebaseAdminApp().auth();
}

module.exports = {
  getFirebaseAdminApp,
  getFirebaseAuth,
};
