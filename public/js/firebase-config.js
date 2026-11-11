// Konfigurasi Firebase (dari Firebase Console → Project settings → General → Your apps).
// Nilai ini memang boleh tampil di kode situs; keamanan data dijaga oleh firestore.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyCOoGRKXY10F7euqH0xypVI8Iwg6pBeJl4",
  authDomain: "proker-kolegium-pmik.firebaseapp.com",
  projectId: "proker-kolegium-pmik",
  storageBucket: "proker-kolegium-pmik.firebasestorage.app",
  messagingSenderId: "21484116126",
  appId: "1:21484116126:web:31f0370240e74a7369838f"
};

// Hanya untuk pengujian lokal dengan Firebase Emulator. Biarkan false saat deploy.
export const useEmulator = false;
