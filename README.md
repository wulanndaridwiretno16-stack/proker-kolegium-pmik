# Sistem Informasi Program Kerja — Kolegium Perekam Medis dan Informasi Kesehatan

Aplikasi web untuk perencanaan, pengajuan, persetujuan, pelaksanaan, monitoring, evaluasi, dan pelaporan program kerja.
Situs statis (HTML/CSS/JavaScript tanpa proses build) + Firebase Authentication + Cloud Firestore.

## Menu

Dashboard · Profil Organisasi · Perencanaan Program · Pengajuan Kegiatan · Persetujuan Program · Jadwal Kegiatan ·
Anggaran · Monitoring · Evaluasi Kinerja · Laporan · Dokumen · Manajemen Pengguna

Alur: **Draf → Diajukan → Terverifikasi (sekretaris) → Disahkan (ketua) → Berjalan → Selesai → Laporan**

## Struktur

```
public/                 ← folder yang dipublikasikan Netlify
  index.html
  css/style.css
  js/app.js             ← tampilan dan logika aplikasi
  js/store.js           ← lapisan data (Firebase / mode demo)
  js/firebase-config.js ← ISI DENGAN KONFIGURASI FIREBASE ANDA
  assets/               ← logo dan kop
firestore.rules         ← aturan keamanan Firestore
netlify.toml            ← konfigurasi Netlify (publish = public)
firebase.json           ← untuk deploy rules / emulator (opsional)
```

Selama `firebase-config.js` masih kosong, aplikasi berjalan dalam **mode demo**: data contoh, tersimpan di browser saja,
dan peran dapat diganti lewat pilihan "Masuk sebagai". Mode ini hanya untuk mencoba tampilan.

## 1. Siapkan Firebase

1. Buka <https://console.firebase.google.com> → **Add project**.
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** (mode *production*, lokasi mis. `asia-southeast2` Jakarta).
4. Di Firestore → tab **Rules**: hapus isinya, tempel seluruh isi `firestore.rules`, klik **Publish**.
5. **Project settings (ikon roda gigi) → Your apps → Web (`</>`)** → daftarkan aplikasi → salin objek `firebaseConfig`.
6. Tempel nilainya ke `public/js/firebase-config.js`.

Konfigurasi web Firebase memang boleh berada di repositori publik; keamanan data dijaga oleh `firestore.rules`,
jadi langkah 4 wajib dilakukan.

## 2. Unggah ke GitHub

```bash
git remote add origin https://github.com/NAMA-AKUN/NAMA-REPO.git
```

```bash
git push -u origin main
```

## 3. Deploy ke Netlify

1. <https://app.netlify.com> → **Add new site → Import an existing project → GitHub** → pilih repositori.
2. Build command: kosongkan. Publish directory: `public` (sudah diatur di `netlify.toml`).
3. Setelah situs aktif, salin domainnya (mis. `nama-situs.netlify.app`).
4. Firebase Console → **Authentication → Settings → Authorized domains → Add domain** → tempel domain Netlify.

Setiap `git push` berikutnya otomatis ter-deploy.

## 4. Penggunaan pertama

1. Buka situs → tab **Daftar**. **Pendaftar pertama otomatis menjadi Admin** (segera daftar setelah deploy).
2. Pengurus lain mendaftar sendiri lewat tab **Daftar**; akun mereka berstatus *menunggu aktivasi*.
3. Admin membuka **Manajemen Pengguna** → **Ubah** → tetapkan peran (ketua kolegium, sekretaris, bendahara, ketua bidang),
   bidang, dan status **Aktif**.
4. Lengkapi **Profil Organisasi** (visi, misi, periode, struktur) dan daftar **Bidang**.

## Syarat pengajuan kegiatan

Usulan kegiatan baru bisa diajukan setelah memiliki minimal satu indikator keberhasilan dan minimal satu dokumen
berkategori **TOR/KAK**, **Proposal**, atau **Dokumen Kegiatan** yang diunggah pada kegiatan tersebut.

## Kata sandi

- Setiap pengguna memilih kata sandinya sendiri saat mendaftar (minimal 6 karakter, diketik dua kali).
- **Lupa kata sandi?** di halaman masuk mengirim tautan atur ulang ke email pengguna.
- Setelah masuk, tombol **Ubah kata sandi** di kanan atas mengganti kata sandi (perlu kata sandi saat ini).
- Email atur ulang dikirim oleh Firebase. Teks dan nama pengirimnya dapat diubah di
  Firebase Console → Authentication → Templates → Password reset.

## Hak akses

| Wewenang | Admin | Ketua Kolegium | Sekretaris | Bendahara | Ketua Bidang |
|---|---|---|---|---|---|
| Kelola pengguna dan bidang | ✓ | | | | |
| Sunting profil organisasi | ✓ | | ✓ | | |
| Kelola program kerja | ✓ | ✓ | ✓ | | bidang sendiri |
| Buat dan ajukan usulan kegiatan | ✓ | | | | bidang sendiri |
| Verifikasi / minta revisi | ✓ | | ✓ | | |
| Setujui dan sahkan | ✓ | ✓ | | | |
| Progres, kendala, realisasi indikator | ✓ | | | | bidang sendiri |
| Catat realisasi biaya | ✓ | | | ✓ | |

## Catatan dan batasan

- **Dokumen**: berkas disimpan di Firestore, maksimal ±700 KB per berkas (foto dikecilkan otomatis). Untuk berkas besar,
  simpan di Google Drive lalu tempel tautannya. Ini dipilih agar tidak memerlukan Firebase Storage.
- **Ekspor**: Excel (.xlsx, 4 lembar) dan PDF lewat tombol *Cetak / PDF* → pilih "Simpan sebagai PDF" di dialog cetak.
- **Notifikasi** tampil di dalam aplikasi (Dashboard); belum ada pengiriman email/WhatsApp.
- Aturan Firestore membatasi akses menurut peran dan bidang. Urutan alur persetujuan secara rinci dijaga oleh aplikasi.
- Menghapus pengguna di aplikasi mencabut aksesnya; akun login-nya dapat dihapus di Firebase Console → Authentication.

## Menjalankan secara lokal

```bash
python3 -m http.server 8000 -d public
```

Lalu buka <http://localhost:8000>.
