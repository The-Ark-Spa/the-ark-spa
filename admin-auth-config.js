// Separate Firebase connection for Admin Authentication only.
// Existing Database and Storage remain on the original Firebase connection.
const adminAuthFirebaseConfig = {
  apiKey: String.fromCharCode(65,73,122,97,83,121,67,78,104,65,90,90,118,112,99,67,55,72,111,122,55,67,118,107,57,76,67,78,54,108,120,52,66,82,74,66,65,81,107),
  authDomain: "the-ark-admin-login.firebaseapp.com",
  projectId: "the-ark-admin-login",
  storageBucket: "the-ark-admin-login.firebasestorage.app",
  messagingSenderId: "496450369812",
  appId: "1:496450369812:web:66f636f5089702b8812a01",
  measurementId: "G-WTMFHTJK8M"
};
let adminAuthApp;
try { adminAuthApp = firebase.app("arkAdminAuth"); }
catch (error) { adminAuthApp = firebase.initializeApp(adminAuthFirebaseConfig, "arkAdminAuth"); }
window.adminAuth = adminAuthApp.auth();
