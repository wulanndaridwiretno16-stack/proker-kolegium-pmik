// Lapisan data: Firebase (Auth + Firestore) bila firebase-config.js terisi, selain itu mode demo (localStorage).
import { firebaseConfig, useEmulator } from './firebase-config.js';

export const db = { org: {}, users: [], bidang: [], program: [], kegiatan: [], agenda: [], dokumen: [] };
const COLS = ['users', 'bidang', 'program', 'kegiatan', 'agenda', 'dokumen'];
export const state = {
  mode: firebaseConfig && firebaseConfig.apiKey ? 'firebase' : 'demo',
  ready: false, authed: false, loaded: false, uid: null, email: '', profile: null
};

const LS = 'pmik-proker-demo-v2';
let notify = () => {}, onErr = () => {};
let fb = null, cache = {}, unsubs = [], subscribed = false, got = new Set();

const pad = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const uid = () => Math.random().toString(36).slice(2, 10);

export function orgDefault() {
  return {
    nama: 'Kolegium Perekam Medis dan Informasi Kesehatan',
    namaEn: 'Indonesian College of Medical Records and Health Information',
    alamat: 'Jl Hang Jebat III Blok F3, Kebayoran Baru, Jakarta Selatan 12120',
    email: 'kolegium-pmik@kki.go.id', telepon: '+62 812-2028-6333',
    periode: '', visi: '', misi: '', adart: '', batasPengajuan: '', struktur: strukturBidang()
  };
}
export const BIDANG_DEFAULT = ['Evaluasi dan Ujian', 'Kurikulum', 'Pengembangan Kompetensi', 'Mutu dan Akreditasi', 'Keanggotaan dan Kerja Sama'];
export const BIDANG_LAMA = ['Pendidikan dan Kurikulum', 'Uji Kompetensi', 'Pengembangan Profesi Berkelanjutan', 'Penelitian dan Publikasi', 'Kerja Sama dan Humas'];
export const KETUA_BIDANG = ['Ari Sukawan', 'Deasy Rosmala Dewi', 'Welly Satria Dewi', 'Laela Indawati', 'Aras Rasyid'];
export const strukturBidang = () => BIDANG_DEFAULT.map((b, i) => ({ id: 'sb' + (i + 1), jabatan: `Ketua Bidang ${i + 1} — ${b}`, nama: KETUA_BIDANG[i], level: 3 }));

/* ---------- data contoh untuk mode demo ---------- */
function seedDemo() {
  const y = new Date().getFullYear();
  const d = (m, day) => `${y}-${pad(m)}-${pad(day)}`;
  const bidang = BIDANG_DEFAULT.map((nama, i) => ({ id: 'b' + (i + 1), nama }));
  const users = [
    { id: 'u1', nama: 'Administrator', email: 'admin@contoh.id', role: 'admin', bidangId: '', aktif: true },
    { id: 'u2', nama: 'Ketua Kolegium', email: 'ketua@contoh.id', role: 'ketua', bidangId: '', aktif: true },
    { id: 'u3', nama: 'Sekretaris', email: 'sekretaris@contoh.id', role: 'sekretaris', bidangId: '', aktif: true },
    { id: 'u4', nama: 'Bendahara', email: 'bendahara@contoh.id', role: 'bendahara', bidangId: '', aktif: true },
    ...bidang.map((b, i) => ({ id: 'u' + (i + 5), nama: KETUA_BIDANG[i], email: `bidang${i + 1}@contoh.id`, role: 'koordinator', bidangId: b.id, aktif: true }))
  ];
  const program = [
    { id: 'p1', jenis: 'strategis', nama: 'Penguatan standar pendidikan PMIK', deskripsi: 'Standar pendidikan dan kurikulum yang mutakhir dan selaras kebutuhan layanan.', sasaran: 'Standar pendidikan termutakhir', tahun: '', bidangId: '' },
    { id: 'p2', jenis: 'strategis', nama: 'Penjaminan mutu uji kompetensi', deskripsi: 'Uji kompetensi yang valid, andal, dan terstandar nasional.', sasaran: 'Bank soal dan penguji terstandar', tahun: '', bidangId: '' },
    { id: 'p3', jenis: 'strategis', nama: 'Pengembangan kompetensi berkelanjutan', deskripsi: 'Peningkatan kompetensi dan karya ilmiah PMIK.', sasaran: 'Peningkatan kompetensi anggota profesi', tahun: '', bidangId: '' },
    { id: 'p4', jenis: 'tahunan', nama: 'Pemutakhiran standar dan kurikulum ' + y, deskripsi: '', sasaran: 'Dokumen standar disahkan', tahun: String(y), bidangId: '' },
    { id: 'p5', jenis: 'tahunan', nama: 'Penyelenggaraan uji kompetensi ' + y, deskripsi: '', sasaran: '2 periode uji', tahun: String(y), bidangId: '' },
    { id: 'p6', jenis: 'bidang', nama: 'Pelatihan dan seminar profesi', deskripsi: '', sasaran: '3 pelatihan', tahun: String(y), bidangId: 'b3' },
    { id: 'p7', jenis: 'bidang', nama: 'Penjaminan mutu dan akreditasi', deskripsi: '', sasaran: '5 program studi didampingi', tahun: String(y), bidangId: 'b4' },
    { id: 'p8', jenis: 'bidang', nama: 'Kemitraan dan komunikasi publik', deskripsi: '', sasaran: '3 MoU', tahun: String(y), bidangId: 'b5' }
  ];
  const mk = (id, nama, bidangId, programId, jenis, m1, d1, m2, d2, status, progres, ind, rab, real, kendala) => ({
    id, nama, bidangId, programId, jenis, mulai: d(m1, d1), selesai: d(m2, d2), status, progres,
    tujuan: 'Contoh tujuan kegiatan — silakan disunting.', sasaran: 'Contoh sasaran kegiatan.', lokasi: 'Jakarta', penanggungJawab: '',
    nomor: ['disetujui', 'berjalan', 'selesai'].includes(status) ? `${id.slice(1).padStart(3, '0')}/KPMIK/PK/${y}` : '',
    indikator: ind.map(([n, t, s, r]) => ({ id: uid(), nama: n, target: t, satuan: s, realisasi: r })),
    rab: rab.map(([u, v, s, h, sd]) => ({ id: uid(), uraian: u, volume: v, satuan: s, harga: h, sumber: sd })),
    realisasi: real.map(([t, u, j]) => ({ id: uid(), tanggal: t, uraian: u, jumlah: j })),
    kendala: (kendala || []).map(([t, u, tl, s]) => ({ id: uid(), tanggal: t, uraian: u, tindakLanjut: tl, status: s })),
    riwayat: [{ tanggal: d(1, 5), oleh: 'Data contoh', aksi: 'Dibuat', catatan: '' }]
  });
  const kegiatan = [
    mk('k1', 'Lokakarya revisi standar kurikulum', 'b2', 'p4', 'Kegiatan', 2, 10, 3, 20, 'selesai', 100, [['Draf standar tersusun', 1, 'dokumen', 1], ['Peserta lokakarya', 40, 'orang', 38]], [['Paket rapat', 2, 'hari', 15000000, 'Iuran'], ['Honor narasumber', 4, 'orang', 2500000, 'Iuran']], [[d(3, 22), 'Paket rapat dan honor', 38500000]]),
    mk('k2', 'Uji kompetensi periode I', 'b1', 'p5', 'Kegiatan', 4, 15, 5, 30, 'selesai', 100, [['Peserta uji', 500, 'orang', 540], ['Tingkat kelulusan', 80, '%', 76]], [['Penyusunan soal', 1, 'paket', 30000000, 'Biaya uji'], ['Pelaksanaan uji', 1, 'paket', 60000000, 'Biaya uji']], [[d(5, 31), 'Pelaksanaan periode I', 86000000]]),
    mk('k3', 'Pelatihan klasifikasi dan kodefikasi penyakit', 'b3', 'p6', 'Pelatihan', 7, 5, 7, 8, 'selesai', 100, [['Peserta pelatihan', 100, 'orang', 112], ['Kepuasan peserta', 85, '%', 88]], [['Paket pelatihan', 1, 'paket', 45000000, 'Sponsor']], [[d(7, 10), 'Pelatihan', 42750000]]),
    mk('k4', 'Uji kompetensi periode II', 'b1', 'p5', 'Kegiatan', 10, 1, 12, 15, 'berjalan', 60, [['Peserta uji', 500, 'orang', 310], ['Tingkat kelulusan', 80, '%', 0]], [['Penyusunan soal', 1, 'paket', 30000000, 'Biaya uji'], ['Pelaksanaan uji', 1, 'paket', 60000000, 'Biaya uji']], [[d(10, 20), 'Penyusunan soal', 28000000]], [[d(11, 2), 'Jumlah penguji di wilayah timur belum mencukupi', '', 'terbuka']]),
    mk('k5', 'Pendampingan akreditasi program studi', 'b4', 'p7', 'Kegiatan', 3, 1, 12, 20, 'berjalan', 45, [['Program studi didampingi', 12, 'prodi', 5]], [['Visitasi pendampingan', 2, 'tahap', 12000000, 'Iuran']], [[d(6, 30), 'Tahap 1', 11500000]], [[d(9, 15), 'Jadwal visitasi beberapa prodi mundur', 'Jadwal ulang pada tahap 2', 'ditangani']]),
    mk('k6', 'Penandatanganan kerja sama institusi pendidikan', 'b5', 'p8', 'Kegiatan', 12, 5, 12, 6, 'disetujui', 0, [['MoU ditandatangani', 3, 'dokumen', 0]], [['Rapat dan seremoni', 1, 'paket', 18000000, 'Iuran']], []),
    mk('k7', 'Seminar nasional rekam medis elektronik', 'b3', 'p6', 'Pelatihan', 12, 12, 12, 13, 'diverifikasi', 0, [['Peserta seminar', 300, 'orang', 0]], [['Paket seminar', 1, 'paket', 75000000, 'Sponsor']], []),
    mk('k8', 'Rapat kerja evaluasi akhir tahun', 'b2', 'p4', 'Rapat', 12, 18, 12, 19, 'diajukan', 0, [['Laporan evaluasi', 1, 'dokumen', 0]], [['Paket rapat', 2, 'hari', 12000000, 'Iuran']], []),
    mk('k9', 'Audit mutu internal pendidikan', 'b4', 'p7', 'Kegiatan', 12, 1, 12, 28, 'draft', 0, [['Laporan audit', 5, 'laporan', 0]], [['Tim audit', 5, 'kunjungan', 10000000, 'Iuran']], [])
  ];
  const agenda = [
    { id: 'a1', judul: 'Rapat pleno pengurus', jenis: 'Rapat', tanggal: d(12, 3), waktu: '09:00', tempat: 'Sekretariat', bidangId: '' },
    { id: 'a2', judul: 'Rapat koordinasi bidang', jenis: 'Rapat', tanggal: d(11, 25), waktu: '13:00', tempat: 'Daring', bidangId: '' }
  ];
  const org = {
    ...orgDefault(), periode: `${y - 1}–${y + 3}`,
    visi: '(Contoh) Menjadi kolegium yang menjamin mutu pendidikan dan kompetensi Perekam Medis dan Informasi Kesehatan.',
    misi: '(Contoh) Menyusun dan memutakhirkan standar pendidikan\n(Contoh) Menyelenggarakan uji kompetensi yang bermutu\n(Contoh) Mendorong pengembangan profesi berkelanjutan',
    adart: 'Ringkasan AD/ART dapat ditulis di sini; berkas lengkap diunggah di menu Dokumen.',
    batasPengajuan: d(12, 15),
    struktur: [
      { id: 's1', jabatan: 'Ketua', nama: '(isi nama)', level: 1 }, { id: 's2', jabatan: 'Sekretaris', nama: '(isi nama)', level: 2 },
      { id: 's3', jabatan: 'Bendahara', nama: '(isi nama)', level: 2 },
      ...strukturBidang()
    ]
  };
  return { org, users, bidang, program, kegiatan, agenda, dokumen: [] };
}

/* ---------- inisialisasi ---------- */
export async function init(onChange, onError) {
  notify = onChange; onErr = onError || (() => {});
  if (state.mode === 'demo') {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(LS)); } catch (e) { /* abaikan */ }
    Object.assign(db, data || seedDemo());
    let u = null; try { u = localStorage.getItem(LS + ':uid'); } catch (e) { /* abaikan */ }
    state.uid = db.users.some(x => x.id === u) ? u : db.users[0].id;
    state.ready = state.authed = state.loaded = true;
    notify(); return;
  }
  const base = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const [A, AU, F] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
  const app = A.initializeApp(firebaseConfig), auth = AU.getAuth(app), fs = F.getFirestore(app);
  if (useEmulator) {
    AU.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    F.connectFirestoreEmulator(fs, '127.0.0.1', 8080);
  }
  fb = { AU, F, auth, fs };
  AU.onAuthStateChanged(auth, user => {
    unsubs.forEach(u => u()); unsubs = []; subscribed = false; got = new Set(); cache = {};
    Object.assign(db, { org: {}, users: [], bidang: [], program: [], kegiatan: [], agenda: [], dokumen: [] });
    Object.assign(state, { loaded: false, profile: null });
    if (!user) { Object.assign(state, { ready: true, authed: false, uid: null, email: '' }); notify(); return; }
    Object.assign(state, { authed: true, uid: user.uid, email: user.email || '', ready: false });
    unsubs.push(F.onSnapshot(F.doc(fs, 'users', user.uid), { includeMetadataChanges: true }, snap => {
      // Abaikan tulisan lokal yang belum dikonfirmasi server, agar listener data tidak ditolak aturan keamanan.
      if (snap.metadata.hasPendingWrites) return;
      state.profile = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      state.ready = true;
      if (state.profile && state.profile.aktif && !subscribed) subscribeAll();
      notify();
    }, e => { state.ready = true; onErr(e); notify(); }));
  });
}

function subscribeAll() {
  const { F, fs } = fb, user = state.uid; subscribed = true;
  const mark = k => { got.add(k); if (got.size === COLS.length + 1) state.loaded = true; };
  // Bila listener ditolak sesaat (mis. profil baru saja diaktifkan), coba lagi beberapa kali.
  const listen = (ref, onData, n = 0) => {
    const un = F.onSnapshot(ref, onData, e => {
      if (state.uid !== user) return;
      if (n < 5) setTimeout(() => { if (state.uid === user) listen(ref, onData, n + 1); }, 1500); else onErr(e);
    });
    unsubs.push(() => un());
  };
  COLS.forEach(c => listen(F.collection(fs, c), snap => {
    db[c] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cache[c] = new Map(db[c].map(d => [d.id, JSON.stringify(d)]));
    mark(c); notify();
  }));
  listen(F.doc(fs, 'meta', 'org'), snap => {
    db.org = snap.exists() ? snap.data() : orgDefault();
    cache.org = JSON.stringify(db.org);
    mark('org'); notify();
  });
}

/* ---------- simpan perubahan (hanya dokumen yang berubah) ---------- */
export async function commit() {
  if (state.mode === 'demo') {
    try { localStorage.setItem(LS, JSON.stringify(db)); } catch (e) { onErr(e); }
    return;
  }
  if (!state.loaded) return;
  const { F, fs } = fb, ops = [];
  for (const c of COLS) {
    const old = cache[c] || new Map(), cur = new Map(db[c].map(d => [d.id, JSON.stringify(d)]));
    for (const [id, j] of cur) if (old.get(id) !== j) { const data = JSON.parse(j); delete data.id; ops.push(F.setDoc(F.doc(fs, c, id), data)); }
    for (const id of old.keys()) if (!cur.has(id)) ops.push(F.deleteDoc(F.doc(fs, c, id)));
    cache[c] = cur;
  }
  const oj = JSON.stringify(db.org);
  if (oj !== cache.org) { cache.org = oj; ops.push(F.setDoc(F.doc(fs, 'meta', 'org'), JSON.parse(oj))); }
  try { await Promise.all(ops); } catch (e) { onErr(e); }
}

/* ---------- autentikasi ---------- */
export async function login(email, pw) { await fb.AU.signInWithEmailAndPassword(fb.auth, email, pw); }
export async function register(nama, email, pw) {
  await fb.AU.createUserWithEmailAndPassword(fb.auth, email, pw);
  await ensureProfile(nama);
}
// Pengguna pertama (sebelum meta/org ada) menjadi admin; berikutnya menunggu aktivasi admin.
export async function ensureProfile(nama) {
  const { F, fs, auth } = fb, u = auth.currentUser;
  const first = !(await F.getDoc(F.doc(fs, 'meta', 'org'))).exists();
  await F.setDoc(F.doc(fs, 'users', u.uid), { nama, email: u.email || '', role: first ? 'admin' : 'koordinator', bidangId: '', aktif: first, dibuat: isoDate(new Date()) });
  if (first) {
    await F.setDoc(F.doc(fs, 'meta', 'org'), orgDefault());
    await Promise.all(BIDANG_DEFAULT.map((nama, i) => F.setDoc(F.doc(fs, 'bidang', 'b' + (i + 1)), { nama })));
  }
}
export async function resetPassword(email) { await fb.AU.sendPasswordResetEmail(fb.auth, email); }
export async function logout() { if (fb) await fb.AU.signOut(fb.auth); }
export function switchUser(id) { state.uid = id; try { localStorage.setItem(LS + ':uid', id); } catch (e) { /* abaikan */ } notify(); }
export function resetDemo() {
  try { Object.keys(localStorage).filter(k => k.startsWith(LS)).forEach(k => localStorage.removeItem(k)); } catch (e) { /* abaikan */ }
  location.reload();
}

/* ---------- berkas (disimpan sebagai data URL; maks ±900 KB per berkas) ---------- */
export async function fileSave(id, dataUrl) {
  if (state.mode === 'demo') { localStorage.setItem(LS + ':f:' + id, dataUrl); return; }
  await fb.F.setDoc(fb.F.doc(fb.fs, 'files', id), { data: dataUrl });
}
export async function fileGet(id) {
  if (state.mode === 'demo') return localStorage.getItem(LS + ':f:' + id);
  const s = await fb.F.getDoc(fb.F.doc(fb.fs, 'files', id));
  return s.exists() ? s.data().data : null;
}
export async function fileDel(id) {
  if (state.mode === 'demo') { localStorage.removeItem(LS + ':f:' + id); return; }
  await fb.F.deleteDoc(fb.F.doc(fb.fs, 'files', id));
}
