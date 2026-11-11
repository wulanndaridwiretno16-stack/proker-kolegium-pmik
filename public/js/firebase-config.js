// Konfigurasi Firebase.
// Salin dari Firebase Console → Project settings → Your apps → Web app → "firebaseConfig".
// Selama apiKey masih kosong, aplikasi berjalan dalam MODE DEMO (data contoh, tersimpan di browser saja).
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Hanya untuk pengujian lokal dengan Firebase Emulator. Biarkan false saat deploy.
export const useEmulator = false;
