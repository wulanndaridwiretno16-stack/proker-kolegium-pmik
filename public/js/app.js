import * as S from './store.js';
const db = S.db, st = S.state;

/* ================= util ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const D = s => new Date(s + 'T00:00:00');
const tgl = s => s ? D(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';
const days = (a, b) => Math.round((D(b) - D(a)) / 864e5);
const rp = n => 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
const pct = n => (n == null || isNaN(n) ? '–' : Math.round(n) + '%');
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const ROLE = { admin: 'Admin', ketua: 'Ketua Kolegium', sekretaris: 'Sekretaris', bendahara: 'Bendahara', koordinator: 'Ketua Bidang' };
const ST = {
  draft: ['Draf', ''], diajukan: ['Diajukan', 'blue'], revisi: ['Perlu Revisi', 'amber'], diverifikasi: ['Terverifikasi', 'indigo'],
  disetujui: ['Disahkan', 'green'], berjalan: ['Berjalan', 'cyan'], selesai: ['Selesai', 'solid'], ditolak: ['Ditolak', 'red']
};
const AKTIF = ['disetujui', 'berjalan', 'selesai'];
const KATEGORI = ['SK', 'Proposal', 'TOR/KAK', 'Undangan', 'Daftar Hadir', 'Dokumentasi', 'Laporan', 'AD/ART', 'Lainnya'];
const JENIS_KEG = ['Kegiatan', 'Rapat', 'Pelatihan'];

const ICON = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6', org: 'M4 21V5l8-2v18M12 9l8 2v10M2 21h20M7 8h2M7 12h2M7 16h2M15 14h2M15 17h2',
  plan: 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4M8 14h2M12 14h2M16 14h0M8 17h2', form: 'M6 4h12v17H6zM9 2h6v4H9zM9 11h6M9 15h6',
  check: 'M12 3a9 9 0 100 18 9 9 0 000-18zM8 12l3 3 5-6', cal: 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4',
  wallet: 'M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l12-3v3M16 13h2', mon: 'M4 4h16v16H4zM7 14l3-3 3 2 4-5',
  eval: 'M4 20V10M9 20V6M14 20v-8M19 20V4M3 20h18', rep: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h3', doc: 'M3 7V5h7l2 2h9v12H3z',
  users: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 11a3 3 0 100-6M18 15c2 .5 3 2.5 3 5', menu: 'M4 6h16M4 12h16M4 18h16'
};
const ico = n => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
const MENU = [
  ['dashboard', 'Dashboard', 'home', 'Ringkasan program kerja'], ['profil', 'Profil Organisasi', 'org', 'Identitas dan struktur organisasi'],
  ['perencanaan', 'Perencanaan Program', 'plan', 'Program strategis, tahunan, dan per bidang'], ['pengajuan', 'Pengajuan Kegiatan', 'form', 'Usulan kegiatan bidang'],
  ['persetujuan', 'Persetujuan Program', 'check', 'Verifikasi dan pengesahan'], ['jadwal', 'Jadwal Kegiatan', 'cal', 'Kalender pelaksanaan'],
  ['anggaran', 'Anggaran', 'wallet', 'RAB dan realisasi biaya'], ['monitoring', 'Monitoring', 'mon', 'Pemantauan progres kegiatan'],
  ['evaluasi', 'Evaluasi Kinerja', 'eval', 'Indikator dan capaian'], ['laporan', 'Laporan', 'rep', 'Laporan kegiatan berkala'],
  ['dokumen', 'Dokumen', 'doc', 'Arsip dan bukti kegiatan'], ['pengguna', 'Manajemen Pengguna', 'users', 'Pengurus dan hak akses']
];

let ui = { tahun: String(new Date().getFullYear()), cal: { y: new Date().getFullYear(), m: new Date().getMonth() }, lap: { jenis: 'tahunan', idx: 0 }, progTab: 'strategis', docKat: '', monBidang: '', authTab: 'masuk', authErr: '' };
try { const t = localStorage.getItem('pmik-tahun'); if (t) ui.tahun = t; } catch (e) { /* abaikan */ }

function toast(msg, bad) {
  const d = document.createElement('div'); d.textContent = msg; if (bad) d.className = 'bad';
  $('#toast').append(d); setTimeout(() => d.remove(), bad ? 6000 : 2800);
}
const fbErr = e => ({
  'auth/invalid-credential': 'Email atau kata sandi salah.', 'auth/wrong-password': 'Email atau kata sandi salah.', 'auth/user-not-found': 'Akun tidak ditemukan.',
  'auth/email-already-in-use': 'Email sudah terdaftar.', 'auth/weak-password': 'Kata sandi minimal 6 karakter.', 'auth/invalid-email': 'Format email tidak valid.',
  'permission-denied': 'Akses ditolak oleh aturan keamanan (peran Anda tidak diizinkan).', 'auth/network-request-failed': 'Jaringan bermasalah.'
}[e && e.code] || (e && e.message) || 'Terjadi kesalahan.');

/* ================= data helpers ================= */
const me = () => db.users.find(u => u.id === st.uid) || st.profile || { nama: '', role: 'koordinator', bidangId: '' };
const is = (...r) => r.includes(me().role);
const bidang = id => (db.bidang.find(b => b.id === id) || {}).nama || '–';
const program = id => (db.program.find(p => p.id === id) || {}).nama || '–';
const keg = id => db.kegiatan.find(k => k.id === id);
const K = () => db.kegiatan.filter(k => (k.mulai || '').slice(0, 4) === ui.tahun);
const angg = k => (k.rab || []).reduce((a, r) => a + r.volume * r.harga, 0);
const real = k => (k.realisasi || []).reduce((a, r) => a + r.jumlah, 0);
const capaian = k => { const i = (k.indikator || []).filter(x => x.target > 0); return i.length ? i.reduce((a, x) => a + Math.min(100, (x.realisasi || 0) / x.target * 100), 0) / i.length : null; };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const sum = a => a.reduce((x, y) => x + y, 0);
const milik = k => is('admin') || (is('koordinator') && k.bidangId === me().bidangId);
const can = {
  buat: () => is('admin', 'koordinator'),
  edit: k => milik(k) && ['draft', 'revisi'].includes(k.status),
  verif: k => is('admin', 'sekretaris') && k.status === 'diajukan',
  sah: k => is('admin', 'ketua') && k.status === 'diverifikasi',
  laksana: k => milik(k) && ['disetujui', 'berjalan'].includes(k.status),
  realInd: k => milik(k) && ['berjalan', 'selesai'].includes(k.status),
  biaya: k => is('admin', 'bendahara') && AKTIF.includes(k.status),
  tindak: () => is('admin', 'sekretaris'),
  program: () => is('admin', 'sekretaris', 'ketua', 'koordinator'),
  org: () => is('admin', 'sekretaris'),
  agenda: () => is('admin', 'sekretaris', 'koordinator'),
  hapusDok: d => is('admin', 'sekretaris') || d.olehId === st.uid
};
const log = (k, aksi, catatan = '') => (k.riwayat = k.riwayat || []).push({ tanggal: today(), oleh: `${me().nama} (${ROLE[me().role]})`, aksi, catatan });
const chip = s => `<span class="chip ${ST[s][1]}">${ST[s][0]}</span>`;
const bar = (v, cls = '') => `<div class="prog"><div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, v || 0))}%"></i></div><span>${pct(v || 0)}</span></div>`;
const hasLaporan = k => db.dokumen.some(d => d.kegiatanId === k.id && d.kategori === 'Laporan');
const telat = k => k.status === 'berjalan' && k.selesai < today();
const predikat = n => n == null ? '–' : n >= 90 ? 'Sangat Baik' : n >= 75 ? 'Baik' : n >= 60 ? 'Cukup' : 'Perlu Perbaikan';

function notifs() {
  const u = me(), t = today(), n = [];
  const add = (lv, tx, id) => n.push({ lv, tx, id });
  const mine = k => u.role !== 'koordinator' || k.bidangId === u.bidangId;
  K().forEach(k => {
    const d = days(t, k.mulai), de = days(t, k.selesai), nm = `“${k.nama}”`;
    if (is('admin', 'koordinator') && mine(k)) {
      if (k.status === 'revisi') add('warn', `${nm} perlu direvisi sebelum diajukan ulang`, k.id);
      if (k.status === 'draft' && d <= 30) add(d < 0 ? 'bad' : 'warn', `Draf ${nm} belum diajukan — jadwal mulai ${d < 0 ? 'sudah lewat' : d + ' hari lagi'}`, k.id);
    }
    if (k.status === 'diajukan' && is('admin', 'sekretaris')) add('info', `${nm} menunggu verifikasi sekretariat`, k.id);
    if (k.status === 'diverifikasi' && is('admin', 'ketua')) add('info', `${nm} menunggu pengesahan ketua`, k.id);
    if (!mine(k)) return;
    if (k.status === 'disetujui' && d <= 0) add('warn', `${nm} sudah masuk jadwal tetapi belum dimulai`, k.id);
    if (k.status === 'berjalan' && de < 0) add('bad', `${nm} melewati tanggal selesai (${-de} hari, progres ${k.progres}%)`, k.id);
    else if (k.status === 'berjalan' && de <= 7) add('warn', `${nm} berakhir ${de} hari lagi (progres ${k.progres}%)`, k.id);
    if (k.status === 'selesai' && !hasLaporan(k)) add('warn', `Laporan ${nm} belum diunggah`, k.id);
  });
  if (db.org.batasPengajuan) { const d = days(t, db.org.batasPengajuan); if (d >= 0 && d <= 30) add('info', `Batas pengajuan program kerja ${d === 0 ? 'hari ini' : d + ' hari lagi'} (${tgl(db.org.batasPengajuan)})`); }
  db.agenda.forEach(a => { const d = days(t, a.tanggal); if (d >= 0 && d <= 7) add('info', `${a.jenis}: ${a.judul} — ${d === 0 ? 'hari ini' : tgl(a.tanggal)} ${a.waktu || ''}`); });
  const o = { bad: 0, warn: 1, info: 2 };
  return n.sort((a, b) => o[a.lv] - o[b.lv]);
}

/* ================= form modal ================= */
function fieldHtml(f) {
  const a = `name="${f.name}" ${f.required ? 'required' : ''}`, v = f.value ?? '';
  let inp;
  if (f.type === 'textarea') inp = `<textarea ${a}>${esc(v)}</textarea>`;
  else if (f.type === 'select') inp = `<select ${a}>${f.options.map(([val, l]) => `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  else if (f.type === 'file') inp = `<input type="file" ${a}>`;
  else inp = `<input type="${f.type || 'text'}" ${a} value="${esc(v)}" ${f.type === 'number' ? `min="${f.min ?? 0}" ${f.max != null ? `max="${f.max}"` : ''} step="any"` : ''}>`;
  return `<label class="f ${f.full || f.type === 'textarea' ? 'full' : ''}">${esc(f.label)}${inp}${f.hint ? `<small>${esc(f.hint)}</small>` : ''}</label>`;
}
function form(title, fields, onSave, okLabel = 'Simpan') {
  const dlg = $('#dlg');
  dlg.innerHTML = `<form class="modal"><h3>${esc(title)}</h3><div class="fgrid">${fields.map(fieldHtml).join('')}</div><div class="err" hidden></div>
    <div class="mfoot"><button type="button" class="btn" data-close>Batal</button><button class="btn primary">${esc(okLabel)}</button></div></form>`;
  const fm = $('form', dlg);
  $('[data-close]', dlg).onclick = () => dlg.close();
  fm.onsubmit = async e => {
    e.preventDefault();
    const v = {};
    fields.forEach(f => { const el = fm.elements[f.name]; v[f.name] = f.type === 'number' ? Number(el.value || 0) : f.type === 'file' ? el.files[0] : el.value.trim(); });
    try {
      const err = await onSave(v);
      if (err) { const b = $('.err', dlg); b.textContent = err; b.hidden = false; return; }
      dlg.close(); done();
    } catch (ex) { const b = $('.err', dlg); b.textContent = fbErr(ex); b.hidden = false; }
  };
  dlg.showModal();
}
function done(msg) { S.commit(); render(); if (msg) toast(msg); }
const optBidang = (kosong) => [...(kosong ? [['', kosong]] : []), ...db.bidang.map(b => [b.id, b.nama])];

/* ================= views ================= */
const V = {};
const head = (t, sub, right = '') => `<div class="phead"><div><h1>${esc(t)}</h1><p>${esc(sub)}</p></div><div class="sp"></div><div class="btns">${right}</div></div>`;
const empty = t => `<div class="empty">${esc(t)}</div>`;
const table = (heads, rows, foot = '') => rows.length ? `<div class="tw"><table><thead><tr>${heads.map(h => `<th${/^(Anggaran|Realisasi|Sisa|Jumlah|Target|Volume|Harga|Nilai|Serapan)/.test(h) ? ' class="num"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody>${foot ? `<tfoot>${foot}</tfoot>` : ''}</table></div>` : '';
const klink = k => `<a href="#/kegiatan/${k.id}"><b>${esc(k.nama)}</b></a><div class="small muted">${esc(bidang(k.bidangId))}</div>`;

V.dashboard = () => {
  const ks = K(), ak = ks.filter(k => AKTIF.includes(k.status)), nt = notifs();
  const tot = sum(ak.map(angg)), rl = sum(ak.map(real)), cap = avg(ak.map(k => k.status === 'selesai' ? 100 : k.progres || 0)) || 0;
  const tunggu = ks.filter(k => ['diajukan', 'diverifikasi'].includes(k.status)).length;
  const C = 2 * Math.PI * 34;
  const perB = db.bidang.map(b => { const x = ak.filter(k => k.bidangId === b.id); return { b, n: x.length, p: avg(x.map(k => k.progres || 0)), s: x.filter(k => k.status === 'selesai').length }; });
  const stat = Object.keys(ST).map(s => [s, ks.filter(k => k.status === s).length]).filter(x => x[1]);
  const next = [...ak.filter(k => k.selesai >= today()).map(k => ({ t: k.mulai, n: k.nama, j: k.jenis, id: k.id })), ...db.agenda.filter(a => a.tanggal >= today()).map(a => ({ t: a.tanggal, n: a.judul, j: a.jenis }))].sort((a, b) => a.t.localeCompare(b.t)).slice(0, 6);
  return head('Dashboard', is('ketua', 'admin') ? `Dashboard pimpinan — seluruh capaian organisasi tahun ${ui.tahun}` : `Ringkasan program kerja tahun ${ui.tahun}`) + `
  <div class="grid tiles">
    <div class="card tile"><div class="lbl">Program kerja</div><div class="val">${db.program.filter(p => !p.tahun || p.tahun === ui.tahun).length}</div><div class="sub">strategis, tahunan, bidang</div></div>
    <div class="card tile"><div class="lbl">Kegiatan diusulkan</div><div class="val">${ks.length}</div><div class="sub">${ak.length} telah disahkan</div></div>
    <div class="card tile"><div class="lbl">Sedang berjalan</div><div class="val">${ks.filter(k => k.status === 'berjalan').length}</div><div class="sub">${ks.filter(telat).length} melewati jadwal</div></div>
    <div class="card tile"><div class="lbl">Selesai</div><div class="val">${ks.filter(k => k.status === 'selesai').length}</div><div class="sub">dari ${ak.length} kegiatan disahkan</div></div>
    <div class="card tile"><div class="lbl">Menunggu persetujuan</div><div class="val">${tunggu}</div><div class="sub">verifikasi / pengesahan</div></div>
  </div>
  <div class="grid g3 mt">
    <div class="card"><h3>Capaian tahunan</h3><div class="donut">
      <svg width="92" height="92" viewBox="0 0 80 80" role="img" aria-label="Capaian ${pct(cap)}"><circle cx="40" cy="40" r="34" fill="none" stroke="#eceff4" stroke-width="9"/><circle cx="40" cy="40" r="34" fill="none" stroke="#1f4391" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C * cap / 100} ${C}" transform="rotate(-90 40 40)"/></svg>
      <div><div class="big">${pct(cap)}</div><div class="small muted">rata-rata progres ${ak.length} kegiatan yang disahkan</div></div></div></div>
    <div class="card"><h3>Serapan anggaran</h3><div class="big" style="font-size:22px;font-weight:700;color:var(--navy-d)">${rp(rl)}</div><div class="small muted">dari anggaran ${rp(tot)}</div><div class="mt">${bar(tot ? rl / tot * 100 : 0, 'n')}</div></div>
    <div class="card"><h3>Status kegiatan</h3><div class="rows">${stat.map(([s, n]) => `<div class="prog">${chip(s)}<div class="bar"><i style="width:${n / ks.length * 100}%"></i></div><span>${n}</span></div>`).join('') || empty('Belum ada kegiatan')}</div></div>
  </div>
  <div class="grid g2 mt">
    <div class="card"><h3>Progres per bidang</h3><div class="rows">${perB.map(x => `<div class="rowbar"><div class="t"><span>${esc(x.b.nama)}</span><span class="muted small">${x.s}/${x.n} selesai</span></div>${bar(x.p || 0, 'g')}</div>`).join('') || empty('Belum ada bidang')}</div></div>
    <div class="card"><div class="chead"><h3>Notifikasi</h3><span class="chip ${nt.length ? 'amber' : ''}">${nt.length}</span></div>
      ${nt.slice(0, 8).map(n => `<div class="notif"><i class="dot ${n.lv}"></i><div>${n.id ? `<a href="#/kegiatan/${n.id}">${esc(n.tx)}</a>` : esc(n.tx)}</div></div>`).join('') || empty('Tidak ada pengingat')}
      ${nt.length > 8 ? `<div class="small muted">+${nt.length - 8} lainnya</div>` : ''}</div>
  </div>
  <div class="card mt"><div class="chead"><h3>Agenda terdekat</h3><a class="btn sm" href="#/jadwal">Buka kalender</a></div>
    ${table(['Tanggal', 'Agenda', 'Jenis'], next.map(x => `<tr><td class="nowrap">${tgl(x.t)}</td><td>${x.id ? `<a href="#/kegiatan/${x.id}">${esc(x.n)}</a>` : esc(x.n)}</td><td>${esc(x.j)}</td></tr>`)) || empty('Belum ada agenda mendatang')}</div>`;
};

V.profil = () => {
  const o = db.org, ed = can.org(), lv = n => (o.struktur || []).filter(s => Number(s.level) === n);
  return head('Profil Organisasi', 'Identitas dan struktur organisasi', ed ? `<button class="btn primary" data-act="orgEdit">Sunting profil</button>` : '') + `
  <div class="grid g2">
    <div class="card"><h3>Identitas</h3><dl class="kv"><dt>Nama</dt><dd><b>${esc(o.nama)}</b><div class="small muted">${esc(o.namaEn)}</div></dd><dt>Alamat</dt><dd>${esc(o.alamat)}</dd><dt>Email</dt><dd>${esc(o.email)}</dd><dt>Telepon</dt><dd>${esc(o.telepon)}</dd><dt>Periode kepengurusan</dt><dd>${esc(o.periode) || '–'}</dd><dt>Batas pengajuan proker</dt><dd>${tgl(o.batasPengajuan)}</dd></dl></div>
    <div class="card"><h3>Visi</h3><p style="margin:0 0 12px">${esc(o.visi) || '<span class="muted">Belum diisi</span>'}</p><h3>Misi</h3>${o.misi ? `<ol style="margin:0;padding-left:20px">${o.misi.split('\n').filter(Boolean).map(m => `<li>${esc(m)}</li>`).join('')}</ol>` : '<p class="muted">Belum diisi</p>'}</div>
  </div>
  <div class="card mt"><div class="chead"><h3>AD/ART</h3><a class="btn sm" href="#/dokumen">Berkas di menu Dokumen</a></div><p style="margin:0;white-space:pre-wrap">${esc(o.adart) || '<span class="muted">Ringkasan belum diisi</span>'}</p></div>
  <div class="card mt"><div class="chead"><h3>Struktur organisasi</h3>${ed ? `<button class="btn sm" data-act="strukAdd">+ Jabatan</button>` : ''}</div>
    ${(o.struktur || []).length ? `<div class="org">${[1, 2, 3].map(n => lv(n).length ? `<div class="lvl l${n}">${lv(n).map(s => `<div class="box"><b>${esc(s.jabatan)}</b>${esc(s.nama)}${ed ? `<div class="btns" style="justify-content:center;margin-top:4px"><button class="btn sm" data-act="strukEdit" data-id="${s.id}">Ubah</button><button class="btn sm danger" data-act="strukDel" data-id="${s.id}">Hapus</button></div>` : ''}</div>`).join('')}</div>` : '').join('')}</div>` : empty('Struktur belum diisi')}</div>`;
};

V.perencanaan = () => {
  const tab = ui.progTab, list = db.program.filter(p => p.jenis === tab && (tab === 'strategis' || p.tahun === ui.tahun));
  const rows = list.map(p => {
    const ks = db.kegiatan.filter(k => k.programId === p.id && (tab === 'strategis' || (k.mulai || '').slice(0, 4) === ui.tahun)), ak = ks.filter(k => AKTIF.includes(k.status));
    const edit = can.program() && (!is('koordinator') || (p.jenis === 'bidang' && p.bidangId === me().bidangId));
    return `<tr><td><b>${esc(p.nama)}</b><div class="small muted">${esc(p.deskripsi)}</div></td>${tab === 'bidang' ? `<td>${esc(bidang(p.bidangId))}</td>` : ''}<td>${esc(p.sasaran) || '–'}</td><td class="num">${ks.length}</td><td style="min-width:140px">${bar(avg(ak.map(k => k.progres || 0)) || 0)}</td>
    <td>${edit ? `<div class="btns"><button class="btn sm" data-act="progEdit" data-id="${p.id}">Ubah</button><button class="btn sm danger" data-act="progDel" data-id="${p.id}">Hapus</button></div>` : ''}</td></tr>`;
  });
  return head('Perencanaan Program', 'Program strategis, program tahunan, dan program per bidang', `<button class="btn" data-act="tahunAdd">+ Tahun</button>` + (can.program() ? `<button class="btn primary" data-act="progAdd">+ Program</button>` : '')) + `
  <div class="card"><div class="tabs">${[['strategis', 'Program strategis'], ['tahunan', `Program tahunan ${ui.tahun}`], ['bidang', `Program per bidang ${ui.tahun}`]].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="progTab" data-id="${k}">${l}</button>`).join('')}</div>
  ${table(['Program', ...(tab === 'bidang' ? ['Bidang'] : []), 'Sasaran', 'Kegiatan', 'Progres', ''], rows) || empty('Belum ada program pada kategori ini')}</div>`;
};

V.pengajuan = () => {
  const ks = K().filter(k => !is('koordinator') || k.bidangId === me().bidangId).sort((a, b) => a.mulai.localeCompare(b.mulai));
  return head('Pengajuan Kegiatan', is('koordinator') ? `Usulan kegiatan ${bidang(me().bidangId)} — tahun ${ui.tahun}` : `Usulan kegiatan seluruh bidang — tahun ${ui.tahun}`, can.buat() ? `<button class="btn primary" data-act="kegAdd">+ Usulan kegiatan</button>` : '') + `
  <div class="card">${table(['Kegiatan', 'Program', 'Jadwal', 'Anggaran', 'Status', ''], ks.map(k => `<tr><td>${klink(k)}</td><td>${esc(program(k.programId))}</td><td class="nowrap">${tgl(k.mulai)} – ${tgl(k.selesai)}</td><td class="num">${rp(angg(k))}</td><td>${chip(k.status)}</td>
    <td><div class="btns"><a class="btn sm" href="#/kegiatan/${k.id}">Buka</a>${can.edit(k) ? `<button class="btn sm primary" data-act="ajukan" data-id="${k.id}">Ajukan</button>` : ''}</div></td></tr>`)) || empty('Belum ada usulan kegiatan. Buat usulan, lengkapi indikator dan RAB, lalu ajukan ke sekretariat.')}</div>
  <p class="small muted mt">Alur: Draf → Diajukan ke sekretariat → Terverifikasi → Disahkan ketua → Berjalan → Selesai dan dilaporkan.</p>`;
};

V.persetujuan = () => {
  const ks = K(), q = ks.filter(k => ['diajukan', 'diverifikasi'].includes(k.status)), rw = ks.filter(k => ['disetujui', 'berjalan', 'selesai', 'ditolak', 'revisi'].includes(k.status));
  return head('Persetujuan Program', 'Review sekretariat, revisi, persetujuan ketua, dan pengesahan') + `
  <div class="card"><h3>Antrean (${q.length})</h3>${table(['Kegiatan', 'Jadwal', 'Anggaran', 'Tahap', 'Tindakan'], q.map(k => `<tr><td>${klink(k)}</td><td class="nowrap">${tgl(k.mulai)}</td><td class="num">${rp(angg(k))}</td><td>${chip(k.status)}<div class="small muted">${k.status === 'diajukan' ? 'menunggu sekretaris' : 'menunggu ketua'}</div></td><td><div class="btns">${aksiSetuju(k) || '<span class="small muted">Bukan wewenang peran Anda</span>'}</div></td></tr>`)) || empty('Tidak ada usulan yang menunggu')}</div>
  <div class="card mt"><h3>Riwayat keputusan</h3>${table(['Kegiatan', 'Status', 'No. pengesahan', 'Catatan terakhir'], rw.map(k => { const r = (k.riwayat || []).slice(-1)[0] || {}; return `<tr><td>${klink(k)}</td><td>${chip(k.status)}</td><td>${esc(k.nomor) || '–'}</td><td class="small">${esc(r.aksi || '')}${r.catatan ? ' — ' + esc(r.catatan) : ''}<div class="muted">${tgl(r.tanggal)} · ${esc(r.oleh || '')}</div></td></tr>`; })) || empty('Belum ada keputusan')}</div>`;
};
const aksiSetuju = k => (can.verif(k) ? `<button class="btn sm ok" data-act="verif" data-id="${k.id}">Verifikasi</button><button class="btn sm" data-act="revisi" data-id="${k.id}">Minta revisi</button>` : '') +
  (can.sah(k) ? `<button class="btn sm ok" data-act="sahkan" data-id="${k.id}">Setujui &amp; sahkan</button><button class="btn sm" data-act="revisi" data-id="${k.id}">Minta revisi</button><button class="btn sm danger" data-act="tolak" data-id="${k.id}">Tolak</button>` : '');

V.jadwal = () => {
  const { y, m } = ui.cal, first = new Date(y, m, 1), start = new Date(y, m, 1 - ((first.getDay() + 6) % 7)), cells = [];
  const evs = [...db.kegiatan.filter(k => AKTIF.includes(k.status)).map(k => ({ a: k.mulai, b: k.selesai, n: k.nama, j: k.jenis, href: `#/kegiatan/${k.id}` })), ...db.agenda.map(a => ({ a: a.tanggal, b: a.tanggal, n: `${a.waktu || ''} ${a.judul}`.trim(), j: a.jenis }))];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); const s = iso(d);
    if (i >= 35 && d.getMonth() !== m) break;
    const e = evs.filter(x => x.a <= s && x.b >= s);
    cells.push(`<div class="d ${d.getMonth() !== m ? 'out' : ''} ${s === today() ? 'today' : ''}"><span class="n">${d.getDate()}</span>${e.slice(0, 3).map(x => `<a class="ev ${esc(x.j)}" ${x.href ? `href="${x.href}"` : ''} title="${esc(x.n)}">${esc(x.n)}</a>`).join('')}${e.length > 3 ? `<span class="small muted">+${e.length - 3}</span>` : ''}</div>`);
  }
  const mm = `${y}-${pad(m + 1)}`, ag = db.agenda.filter(a => a.tanggal.startsWith(mm)).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const lat = db.kegiatan.filter(k => k.jenis === 'Pelatihan' && AKTIF.includes(k.status) && k.mulai.slice(0, 4) === String(y));
  return head('Jadwal Kegiatan', 'Kalender kegiatan, agenda rapat, dan jadwal pelatihan', can.agenda() ? `<button class="btn primary" data-act="agAdd">+ Agenda</button>` : '') + `
  <div class="card"><div class="chead"><button class="btn sm" data-act="calNav" data-id="-1" aria-label="Bulan sebelumnya">‹</button><h3 style="text-align:center">${BULAN[m]} ${y}</h3><button class="btn sm" data-act="calNav" data-id="1" aria-label="Bulan berikutnya">›</button></div>
    <div class="cal">${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => `<div class="dh">${d}</div>`).join('')}${cells.join('')}</div>
    <div class="legend"><span><i style="background:var(--blue-l)"></i>Kegiatan</span><span><i style="background:var(--indigo-l)"></i>Rapat</span><span><i style="background:var(--green-l)"></i>Pelatihan</span><span>Kegiatan tampil setelah disahkan.</span></div></div>
  <div class="grid g2 mt">
    <div class="card"><h3>Agenda rapat &amp; lainnya — ${BULAN[m]}</h3>${table(['Tanggal', 'Agenda', 'Tempat', ''], ag.map(a => `<tr><td class="nowrap">${tgl(a.tanggal)}<div class="small muted">${esc(a.waktu)}</div></td><td>${esc(a.judul)}<div class="small muted">${esc(a.jenis)}${a.bidangId ? ' · ' + esc(bidang(a.bidangId)) : ''}</div></td><td>${esc(a.tempat)}</td><td>${can.agenda() ? `<div class="btns"><button class="btn sm" data-act="agEdit" data-id="${a.id}">Ubah</button><button class="btn sm danger" data-act="agDel" data-id="${a.id}">Hapus</button></div>` : ''}</td></tr>`)) || empty('Tidak ada agenda bulan ini')}</div>
    <div class="card"><h3>Jadwal pelatihan ${y}</h3>${table(['Tanggal', 'Pelatihan', 'Status'], lat.map(k => `<tr><td class="nowrap">${tgl(k.mulai)} – ${tgl(k.selesai)}</td><td>${klink(k)}</td><td>${chip(k.status)}</td></tr>`)) || empty('Belum ada pelatihan yang disahkan')}</div>
  </div>`;
};

V.anggaran = () => {
  const ks = K().filter(k => AKTIF.includes(k.status)), tot = sum(ks.map(angg)), rl = sum(ks.map(real));
  const sd = {}; ks.forEach(k => (k.rab || []).forEach(r => sd[r.sumber || 'Lainnya'] = (sd[r.sumber || 'Lainnya'] || 0) + r.volume * r.harga));
  const usul = sum(K().filter(k => ['draft', 'diajukan', 'diverifikasi', 'revisi'].includes(k.status)).map(angg));
  return head('Anggaran', `Rencana anggaran biaya, sumber dana, dan realisasi — tahun ${ui.tahun}`) + `
  <div class="grid tiles">
    <div class="card tile"><div class="lbl">Anggaran disahkan</div><div class="val" style="font-size:20px">${rp(tot)}</div><div class="sub">${ks.length} kegiatan</div></div>
    <div class="card tile"><div class="lbl">Realisasi</div><div class="val" style="font-size:20px">${rp(rl)}</div><div class="sub">serapan ${pct(tot ? rl / tot * 100 : 0)}</div></div>
    <div class="card tile"><div class="lbl">Sisa anggaran</div><div class="val" style="font-size:20px">${rp(tot - rl)}</div><div class="sub">&nbsp;</div></div>
    <div class="card tile"><div class="lbl">Masih dalam usulan</div><div class="val" style="font-size:20px">${rp(usul)}</div><div class="sub">belum disahkan</div></div>
  </div>
  <div class="grid g2 mt">
    <div class="card"><h3>Sumber dana</h3><div class="rows">${Object.entries(sd).sort((a, b) => b[1] - a[1]).map(([s, v]) => `<div class="rowbar"><div class="t"><span>${esc(s)}</span><span class="num">${rp(v)}</span></div><div class="bar n"><i style="width:${tot ? v / tot * 100 : 0}%"></i></div></div>`).join('') || empty('Belum ada RAB')}</div></div>
    <div class="card"><h3>Anggaran per bidang</h3>${table(['Bidang', 'Anggaran', 'Realisasi', 'Serapan'], db.bidang.map(b => { const x = ks.filter(k => k.bidangId === b.id), a = sum(x.map(angg)), r = sum(x.map(real)); return `<tr><td>${esc(b.nama)}</td><td class="num">${rp(a)}</td><td class="num">${rp(r)}</td><td class="num">${pct(a ? r / a * 100 : 0)}</td></tr>`; }))}</div>
  </div>
  <div class="card mt"><h3>Rincian per kegiatan</h3>${table(['Kegiatan', 'Status', 'Anggaran', 'Realisasi', 'Sisa', 'Serapan', ''], ks.map(k => { const a = angg(k), r = real(k); return `<tr><td>${klink(k)}</td><td>${chip(k.status)}</td><td class="num">${rp(a)}</td><td class="num">${rp(r)}</td><td class="num" ${r > a ? 'style="color:var(--red)"' : ''}>${rp(a - r)}</td><td style="min-width:120px">${bar(a ? r / a * 100 : 0, r > a ? 'r' : 'n')}</td><td>${can.biaya(k) ? `<button class="btn sm" data-act="realAdd" data-id="${k.id}">+ Realisasi</button>` : ''}</td></tr>`; }), `<tr><td colspan="2">Jumlah</td><td class="num">${rp(tot)}</td><td class="num">${rp(rl)}</td><td class="num">${rp(tot - rl)}</td><td colspan="2"></td></tr>`) || empty('Belum ada kegiatan yang disahkan')}</div>`;
};

V.monitoring = () => {
  const ks = K().filter(k => AKTIF.includes(k.status) && (!ui.monBidang || k.bidangId === ui.monBidang)).sort((a, b) => a.mulai.localeCompare(b.mulai));
  const kd = []; ks.forEach(k => (k.kendala || []).forEach(x => kd.push({ k, x })));
  return head('Monitoring', `Status kegiatan, persentase progres, kendala, dan tindak lanjut — tahun ${ui.tahun}`, `<select data-change="monBidang" aria-label="Saring bidang">${optBidang('Semua bidang').map(([v, l]) => `<option value="${v}" ${ui.monBidang === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`) + `
  <div class="card"><h3>Progres kegiatan</h3>${table(['Kegiatan', 'Jadwal', 'Status', 'Progres', 'Kendala terbuka', ''], ks.map(k => `<tr><td>${klink(k)}</td><td class="nowrap">${tgl(k.mulai)} – ${tgl(k.selesai)}${telat(k) ? `<div><span class="chip red">Terlambat ${days(k.selesai, today())} hari</span></div>` : ''}</td><td>${chip(k.status)}</td><td style="min-width:150px">${bar(k.progres, telat(k) ? 'r' : k.status === 'selesai' ? 'g' : '')}</td><td class="num">${(k.kendala || []).filter(x => x.status !== 'selesai').length}</td><td>${can.laksana(k) ? `<button class="btn sm" data-act="${k.status === 'disetujui' ? 'mulai' : 'progres'}" data-id="${k.id}">${k.status === 'disetujui' ? 'Mulai' : 'Perbarui'}</button>` : ''}</td></tr>`)) || empty('Belum ada kegiatan yang disahkan')}</div>
  <div class="card mt"><h3>Kendala dan tindak lanjut</h3>${table(['Tanggal', 'Kegiatan', 'Kendala', 'Tindak lanjut', 'Status', ''], kd.map(({ k, x }) => `<tr><td class="nowrap">${tgl(x.tanggal)}</td><td>${klink(k)}</td><td>${esc(x.uraian)}</td><td>${esc(x.tindakLanjut) || '<span class="muted">Belum ada</span>'}</td><td><span class="chip ${x.status === 'selesai' ? 'green' : x.status === 'ditangani' ? 'blue' : 'amber'}">${esc(x.status)}</span></td><td>${can.tindak() || milik(k) ? `<button class="btn sm" data-act="kdEdit" data-id="${k.id}" data-sub="${x.id}">Tindak lanjut</button>` : ''}</td></tr>`)) || empty('Tidak ada kendala tercatat')}</div>`;
};

function nilaiBidang(ks) {
  return db.bidang.map(b => {
    const x = ks.filter(k => k.bidangId === b.id), c = avg(x.map(capaian).filter(v => v != null)), p = avg(x.map(k => k.progres || 0));
    const n = x.length ? 0.6 * (c ?? p) + 0.4 * p : null;
    return { b, n: x.length, c, p, nilai: n };
  });
}
V.evaluasi = () => {
  const ks = K().filter(k => AKTIF.includes(k.status)), nb = nilaiBidang(ks), ind = [];
  ks.forEach(k => (k.indikator || []).forEach(i => ind.push({ k, i })));
  return head('Evaluasi Kinerja', `Evaluasi indikator, target dan realisasi, serta penilaian bidang — tahun ${ui.tahun}`) + `
  <div class="card"><h3>Penilaian bidang</h3>${table(['Bidang', 'Kegiatan', 'Capaian indikator', 'Progres rata-rata', 'Nilai', 'Predikat'], nb.map(x => `<tr><td><b>${esc(x.b.nama)}</b></td><td class="num">${x.n}</td><td style="min-width:130px">${x.c == null ? '–' : bar(x.c, 'g')}</td><td style="min-width:130px">${x.n ? bar(x.p) : '–'}</td><td class="num"><b>${x.nilai == null ? '–' : x.nilai.toFixed(1)}</b></td><td>${x.nilai == null ? '–' : `<span class="chip ${x.nilai >= 75 ? 'green' : x.nilai >= 60 ? 'amber' : 'red'}">${predikat(x.nilai)}</span>`}</td></tr>`))}
    <p class="small muted" style="margin:10px 0 0">Nilai = 60% capaian indikator + 40% progres rata-rata. Predikat: ≥90 Sangat Baik, ≥75 Baik, ≥60 Cukup, di bawah 60 Perlu Perbaikan. Capaian tiap indikator dibatasi maksimal 100%.</p></div>
  <div class="card mt"><h3>Target dan realisasi indikator</h3>${table(['Kegiatan', 'Indikator', 'Target', 'Realisasi', 'Capaian', ''], ind.map(({ k, i }) => { const c = i.target ? i.realisasi / i.target * 100 : 0; return `<tr><td>${klink(k)}</td><td>${esc(i.nama)}</td><td class="num">${i.target} ${esc(i.satuan)}</td><td class="num">${i.realisasi || 0} ${esc(i.satuan)}</td><td style="min-width:130px">${bar(c, c >= 100 ? 'g' : '')}</td><td>${can.realInd(k) ? `<button class="btn sm" data-act="indReal" data-id="${k.id}" data-sub="${i.id}">Isi realisasi</button>` : ''}</td></tr>`; })) || empty('Belum ada indikator pada kegiatan yang disahkan')}</div>`;
};

function periode() {
  const y = Number(ui.tahun), { jenis, idx } = ui.lap;
  const r = (m1, m2) => [`${y}-${pad(m1)}-01`, iso(new Date(y, m2, 0))];
  if (jenis === 'bulanan') return { label: `Bulan ${BULAN[idx]} ${y}`, range: r(idx + 1, idx + 1) };
  if (jenis === 'triwulan') return { label: `Triwulan ${['I', 'II', 'III', 'IV'][idx]} ${y}`, range: r(idx * 3 + 1, idx * 3 + 3) };
  if (jenis === 'semester') return { label: `Semester ${['I', 'II'][idx]} ${y}`, range: r(idx * 6 + 1, idx * 6 + 6) };
  return { label: `Tahun ${y}`, range: r(1, 12) };
}
function lapData() {
  const p = periode(), [a, b] = p.range;
  const ks = db.kegiatan.filter(k => AKTIF.includes(k.status) && k.mulai <= b && k.selesai >= a).sort((x, y) => x.mulai.localeCompare(y.mulai));
  return { p, ks, tot: sum(ks.map(angg)), rl: sum(ks.map(real)) };
}
V.laporan = () => {
  const { p, ks, tot, rl } = lapData(), L = ui.lap;
  const n = { bulanan: BULAN, triwulan: ['Triwulan I', 'Triwulan II', 'Triwulan III', 'Triwulan IV'], semester: ['Semester I', 'Semester II'], tahunan: [] }[L.jenis];
  return head('Laporan', 'Laporan bulanan, triwulan, semester, dan tahunan', `<button class="btn" data-act="lapXlsx">Ekspor Excel</button><button class="btn primary" data-act="lapPdf">Cetak / PDF</button>`) + `
  <div class="card"><div class="btns" style="margin-bottom:12px">
    <select data-change="lapJenis" aria-label="Jenis laporan" style="width:auto">${['bulanan', 'triwulan', 'semester', 'tahunan'].map(j => `<option value="${j}" ${L.jenis === j ? 'selected' : ''}>Laporan ${j}</option>`).join('')}</select>
    ${n.length ? `<select data-change="lapIdx" aria-label="Periode" style="width:auto">${n.map((x, i) => `<option value="${i}" ${L.idx === i ? 'selected' : ''}>${x}</option>`).join('')}</select>` : ''}</div>
  <h3>Laporan Capaian Program Kerja — ${esc(p.label)}</h3>
  <p class="muted small" style="margin:2px 0 12px">${ks.length} kegiatan · ${ks.filter(k => k.status === 'selesai').length} selesai · anggaran ${rp(tot)} · realisasi ${rp(rl)} (${pct(tot ? rl / tot * 100 : 0)})</p>
  ${lapTable(ks, tot, rl) || empty('Tidak ada kegiatan yang disahkan pada periode ini')}</div>`;
};
const lapTable = (ks, tot, rl) => table(['No', 'Kegiatan', 'Bidang', 'Jadwal', 'Status', 'Progres', 'Capaian indikator', 'Anggaran', 'Realisasi', 'Kendala'], ks.map((k, i) => `<tr><td>${i + 1}</td><td>${esc(k.nama)}</td><td>${esc(bidang(k.bidangId))}</td><td class="nowrap">${tgl(k.mulai)} – ${tgl(k.selesai)}</td><td>${ST[k.status][0]}</td><td class="num">${pct(k.progres)}</td><td class="num">${pct(capaian(k))}</td><td class="num">${rp(angg(k))}</td><td class="num">${rp(real(k))}</td><td>${esc((k.kendala || []).map(x => x.uraian).join('; ')) || '–'}</td></tr>`), `<tr><td colspan="7">Jumlah</td><td class="num">${rp(tot)}</td><td class="num">${rp(rl)}</td><td></td></tr>`);

V.dokumen = () => {
  const ds = db.dokumen.filter(d => !ui.docKat || d.kategori === ui.docKat).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  return head('Dokumen', 'SK, proposal, TOR/KAK, undangan, daftar hadir, dokumentasi, dan laporan', `<select data-change="docKat" aria-label="Saring kategori" style="width:auto"><option value="">Semua kategori</option>${KATEGORI.map(k => `<option ${ui.docKat === k ? 'selected' : ''}>${k}</option>`).join('')}</select><button class="btn primary" data-act="docAdd">+ Unggah dokumen</button>`) + `
  <div class="card">${docTable(ds) || empty('Belum ada dokumen')}</div>
  <p class="small muted mt">Berkas maksimal ±700 KB (foto dikecilkan otomatis). Untuk berkas lebih besar, simpan di Google Drive lalu tempel tautannya.</p>`;
};
const docTable = ds => table(['Dokumen', 'Kategori', 'Kegiatan', 'Diunggah', ''], ds.map(d => `<tr><td><b>${esc(d.judul)}</b><div class="small muted">${esc(d.namaBerkas || d.url || '')}</div></td><td><span class="chip">${esc(d.kategori)}</span></td><td>${d.kegiatanId && keg(d.kegiatanId) ? `<a href="#/kegiatan/${d.kegiatanId}">${esc(keg(d.kegiatanId).nama)}</a>` : '–'}</td><td class="small">${tgl(d.tanggal)}<div class="muted">${esc(d.oleh)}</div></td><td><div class="btns"><button class="btn sm" data-act="docOpen" data-id="${d.id}">Buka</button>${can.hapusDok(d) ? `<button class="btn sm danger" data-act="docDel" data-id="${d.id}">Hapus</button>` : ''}</div></td></tr>`));

V.pengguna = () => {
  const adm = is('admin'), demo = st.mode === 'demo';
  const M = [['Kelola pengguna, bidang, dan hak akses', 1, 0, 0, 0, 0], ['Sunting profil organisasi', 1, 0, 1, 0, 0], ['Kelola program kerja', 1, 1, 1, 0, 'bidang sendiri'], ['Buat dan ajukan usulan kegiatan', 1, 0, 0, 0, 'bidang sendiri'], ['Verifikasi usulan / minta revisi', 1, 0, 1, 0, 0], ['Setujui dan sahkan program', 1, 1, 0, 0, 0], ['Perbarui progres, kendala, realisasi indikator', 1, 0, 0, 0, 'bidang sendiri'], ['Catat realisasi biaya', 1, 0, 0, 1, 0], ['Catat tindak lanjut kendala', 1, 0, 1, 0, 'bidang sendiri'], ['Kelola agenda', 1, 0, 1, 0, 1], ['Unggah dokumen, lihat dashboard dan laporan', 1, 1, 1, 1, 1]];
  return head('Manajemen Pengguna', 'Admin, ketua kolegium, sekretaris, bendahara, dan ketua bidang', adm && demo ? `<button class="btn primary" data-act="userAdd">+ Pengguna</button>` : '') + `
  ${!demo ? `<div class="card" style="margin-bottom:14px"><b>Cara menambah pengguna:</b> pengurus mendaftar sendiri di halaman masuk (tab “Daftar”), lalu Admin mengaktifkan akun serta menetapkan peran dan bidangnya di tabel ini.</div>` : ''}
  <div class="card"><h3>Pengguna</h3>${table(['Nama', 'Email', 'Peran', 'Bidang', 'Status', ''], db.users.map(u => `<tr><td><b>${esc(u.nama)}</b>${u.id === st.uid ? ' <span class="chip blue">Anda</span>' : ''}</td><td>${esc(u.email)}</td><td>${ROLE[u.role] || esc(u.role)}</td><td>${u.role === 'koordinator' ? esc(bidang(u.bidangId)) : '–'}</td><td><span class="chip ${u.aktif ? 'green' : 'amber'}">${u.aktif ? 'Aktif' : 'Menunggu aktivasi'}</span></td><td>${adm ? `<div class="btns"><button class="btn sm" data-act="userEdit" data-id="${u.id}">Ubah</button>${u.id !== st.uid ? `<button class="btn sm danger" data-act="userDel" data-id="${u.id}">Hapus</button>` : ''}</div>` : ''}</td></tr>`))}</div>
  <div class="grid g2 mt">
    <div class="card"><div class="chead"><h3>Bidang</h3>${adm ? `<button class="btn sm" data-act="bidAdd">+ Bidang</button>` : ''}</div>${table(['Nama bidang', 'Ketua bidang', ''], db.bidang.map(b => `<tr><td>${esc(b.nama)}</td><td>${esc(db.users.filter(u => u.role === 'koordinator' && u.bidangId === b.id).map(u => u.nama).join(', ')) || '–'}</td><td>${adm ? `<div class="btns"><button class="btn sm" data-act="bidEdit" data-id="${b.id}">Ubah</button><button class="btn sm danger" data-act="bidDel" data-id="${b.id}">Hapus</button></div>` : ''}</td></tr>`)) || empty('Belum ada bidang')}</div>
    <div class="card"><h3>Hak akses per peran</h3>${table(['Wewenang', 'Admin', 'Ketua Kol.', 'Sekr.', 'Bend.', 'Ketua Bid.'], M.map(r => `<tr><td>${r[0]}</td>${r.slice(1).map(v => `<td>${v === 1 ? '✓' : v ? `<span class="small">${v}</span>` : '<span class="muted">–</span>'}</td>`).join('')}</tr>`))}</div>
  </div>
  ${demo && adm ? `<div class="card mt"><h3>Data demo</h3><p class="muted" style="margin:0 0 10px">Mode demo menyimpan data di browser ini saja. Hubungkan Firebase (lihat README) agar data tersimpan bersama.</p><button class="btn danger" data-act="resetDemo">Kembalikan data contoh</button></div>` : ''}`;
};

/* ---------- detail kegiatan ---------- */
function vKegiatan(id) {
  const k = keg(id); if (!k) return head('Kegiatan tidak ditemukan', '') + `<a class="btn" href="#/pengajuan">Kembali</a>`;
  const ed = can.edit(k), a = angg(k), r = real(k), docs = db.dokumen.filter(d => d.kegiatanId === k.id);
  const FL = ['draft', 'diajukan', 'diverifikasi', 'disetujui', 'berjalan', 'selesai'], pos = FL.indexOf(k.status);
  const btn = [
    ed ? `<button class="btn" data-act="kegEdit" data-id="${k.id}">Sunting</button><button class="btn primary" data-act="ajukan" data-id="${k.id}">Ajukan ke sekretariat</button>` : '',
    aksiSetuju(k),
    can.laksana(k) && k.status === 'disetujui' ? `<button class="btn primary" data-act="mulai" data-id="${k.id}">Mulai pelaksanaan</button>` : '',
    can.laksana(k) && k.status === 'berjalan' ? `<button class="btn" data-act="progres" data-id="${k.id}">Perbarui progres</button><button class="btn ok" data-act="selesai" data-id="${k.id}">Tandai selesai</button>` : '',
    milik(k) && ['draft', 'ditolak'].includes(k.status) ? `<button class="btn danger" data-act="kegDel" data-id="${k.id}">Hapus</button>` : ''
  ].join('');
  return `<div class="phead"><div><a class="small" href="#/pengajuan">← Pengajuan Kegiatan</a><h1>${esc(k.nama)}</h1><p>${esc(bidang(k.bidangId))} · ${esc(k.jenis)} · ${chip(k.status)} ${k.nomor ? `· No. ${esc(k.nomor)}` : ''}</p></div><div class="sp"></div><div class="btns">${btn}</div></div>
  <div class="card"><div class="flow">${k.status === 'revisi' || k.status === 'ditolak' ? `<span class="cur">${ST[k.status][0]}</span>` : FL.map((s, i) => `<span class="${i < pos ? 'done' : i === pos ? 'cur' : ''}">${i + 1}. ${ST[s][0]}</span>`).join('')}</div>
    <dl class="kv mt"><dt>Program</dt><dd>${esc(program(k.programId))}</dd><dt>Tujuan</dt><dd>${esc(k.tujuan) || '–'}</dd><dt>Sasaran</dt><dd>${esc(k.sasaran) || '–'}</dd><dt>Jadwal</dt><dd>${tgl(k.mulai)} – ${tgl(k.selesai)}</dd><dt>Lokasi</dt><dd>${esc(k.lokasi) || '–'}</dd><dt>Penanggung jawab</dt><dd>${esc(k.penanggungJawab) || '–'}</dd><dt>Progres</dt><dd style="max-width:320px">${bar(k.progres, k.status === 'selesai' ? 'g' : '')}</dd></dl></div>
  <div class="grid g2 mt">
    <div class="card"><div class="chead"><h3>Indikator keberhasilan</h3>${ed ? `<button class="btn sm" data-act="indAdd" data-id="${k.id}">+ Indikator</button>` : ''}</div>
      ${table(['Indikator', 'Target', 'Realisasi', 'Capaian', ''], (k.indikator || []).map(i => `<tr><td>${esc(i.nama)}</td><td class="num">${i.target} ${esc(i.satuan)}</td><td class="num">${i.realisasi || 0}</td><td class="num">${pct(i.target ? i.realisasi / i.target * 100 : 0)}</td><td><div class="btns">${ed ? `<button class="btn sm" data-act="indEdit" data-id="${k.id}" data-sub="${i.id}">Ubah</button><button class="btn sm danger" data-act="indDel" data-id="${k.id}" data-sub="${i.id}">Hapus</button>` : can.realInd(k) ? `<button class="btn sm" data-act="indReal" data-id="${k.id}" data-sub="${i.id}">Isi realisasi</button>` : ''}</div></td></tr>`)) || empty('Belum ada indikator. Setiap kegiatan perlu minimal satu indikator terukur.')}</div>
    <div class="card"><div class="chead"><h3>Kendala &amp; tindak lanjut</h3>${milik(k) && AKTIF.includes(k.status) ? `<button class="btn sm" data-act="kdAdd" data-id="${k.id}">+ Kendala</button>` : ''}</div>
      ${table(['Tanggal', 'Kendala', 'Tindak lanjut', 'Status'], (k.kendala || []).map(x => `<tr><td class="nowrap">${tgl(x.tanggal)}</td><td>${esc(x.uraian)}</td><td>${esc(x.tindakLanjut) || '–'}</td><td>${esc(x.status)}</td></tr>`)) || empty('Tidak ada kendala tercatat')}</div>
  </div>
  <div class="card mt"><div class="chead"><h3>Rencana anggaran biaya (RAB)</h3>${ed ? `<button class="btn sm" data-act="rabAdd" data-id="${k.id}">+ Baris RAB</button>` : ''}</div>
    ${table(['Uraian', 'Volume', 'Harga satuan', 'Jumlah', 'Sumber dana', ''], (k.rab || []).map(x => `<tr><td>${esc(x.uraian)}</td><td class="num">${x.volume} ${esc(x.satuan)}</td><td class="num">${rp(x.harga)}</td><td class="num">${rp(x.volume * x.harga)}</td><td>${esc(x.sumber)}</td><td>${ed ? `<div class="btns"><button class="btn sm" data-act="rabEdit" data-id="${k.id}" data-sub="${x.id}">Ubah</button><button class="btn sm danger" data-act="rabDel" data-id="${k.id}" data-sub="${x.id}">Hapus</button></div>` : ''}</td></tr>`), `<tr><td colspan="3">Total anggaran</td><td class="num">${rp(a)}</td><td colspan="2"></td></tr>`) || empty('RAB belum diisi')}</div>
  <div class="card mt"><div class="chead"><h3>Realisasi biaya</h3><span class="muted small">${rp(r)} dari ${rp(a)} (${pct(a ? r / a * 100 : 0)})</span>${can.biaya(k) ? `<button class="btn sm" data-act="realAdd" data-id="${k.id}">+ Realisasi</button>` : ''}</div>
    ${table(['Tanggal', 'Uraian', 'Jumlah', ''], (k.realisasi || []).map(x => `<tr><td class="nowrap">${tgl(x.tanggal)}</td><td>${esc(x.uraian)}</td><td class="num">${rp(x.jumlah)}</td><td>${can.biaya(k) ? `<button class="btn sm danger" data-act="realDel" data-id="${k.id}" data-sub="${x.id}">Hapus</button>` : ''}</td></tr>`)) || empty('Belum ada realisasi (dicatat bendahara setelah kegiatan disahkan)')}</div>
  <div class="card mt"><div class="chead"><h3>Dokumentasi digital</h3><button class="btn sm" data-act="docAdd" data-id="${k.id}">+ Unggah</button></div>${docTable(docs) || empty('Belum ada foto, undangan, daftar hadir, atau laporan')}</div>
  <div class="card mt"><h3>Riwayat</h3>${table(['Tanggal', 'Oleh', 'Aksi', 'Catatan'], (k.riwayat || []).slice().reverse().map(x => `<tr><td class="nowrap">${tgl(x.tanggal)}</td><td>${esc(x.oleh)}</td><td>${esc(x.aksi)}</td><td>${esc(x.catatan) || '–'}</td></tr>`))}</div>`;
}

/* ================= actions ================= */
const sub = (k, key, id) => (k[key] || []).find(x => x.id === id);
const rm = (arr, id) => { const i = arr.findIndex(x => x.id === id); if (i >= 0) arr.splice(i, 1); };
const yakin = t => confirm(t);
function kegForm(k) {
  const u = me(), kor = is('koordinator');
  const progs = db.program.filter(p => p.jenis === 'strategis' || p.tahun === ui.tahun || (k && p.id === k.programId));
  if (!db.bidang.length) return toast('Tambahkan bidang dulu di Manajemen Pengguna.', true);
  if (kor && !u.bidangId) return toast('Akun Anda belum ditetapkan ke bidang. Hubungi admin.', true);
  form(k ? 'Sunting usulan kegiatan' : 'Usulan kegiatan baru', [
    { name: 'nama', label: 'Nama kegiatan', required: true, full: true, value: k?.nama },
    { name: 'bidangId', label: 'Bidang', type: 'select', options: kor ? [[u.bidangId, bidang(u.bidangId)]] : optBidang(), value: k?.bidangId },
    { name: 'programId', label: 'Program kerja', type: 'select', options: [['', '— tanpa program —'], ...progs.map(p => [p.id, p.nama])], value: k?.programId },
    { name: 'jenis', label: 'Jenis', type: 'select', options: JENIS_KEG.map(j => [j, j]), value: k?.jenis },
    { name: 'lokasi', label: 'Lokasi', value: k?.lokasi },
    { name: 'mulai', label: 'Tanggal mulai', type: 'date', required: true, value: k?.mulai },
    { name: 'selesai', label: 'Tanggal selesai', type: 'date', required: true, value: k?.selesai },
    { name: 'tujuan', label: 'Tujuan', type: 'textarea', value: k?.tujuan },
    { name: 'sasaran', label: 'Sasaran', type: 'textarea', value: k?.sasaran },
    { name: 'penanggungJawab', label: 'Penanggung jawab', full: true, value: k?.penanggungJawab }
  ], v => {
    if (v.selesai < v.mulai) return 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
    if (k) { Object.assign(k, v); log(k, 'Disunting'); }
    else { const n = { id: uid(), ...v, status: 'draft', progres: 0, nomor: '', indikator: [], rab: [], realisasi: [], kendala: [], riwayat: [] }; log(n, 'Usulan dibuat'); db.kegiatan.push(n); ui.tahun = v.mulai.slice(0, 4); location.hash = '#/kegiatan/' + n.id; }
  });
}
const catatan = (title, cb, required = true) => form(title, [{ name: 'c', label: 'Catatan', type: 'textarea', required }], v => cb(v.c));
const indFields = i => [{ name: 'nama', label: 'Indikator keberhasilan', required: true, full: true, value: i?.nama, hint: 'Contoh: jumlah peserta, dokumen tersusun, tingkat kelulusan' }, { name: 'target', label: 'Target', type: 'number', required: true, value: i?.target }, { name: 'satuan', label: 'Satuan', required: true, value: i?.satuan }];
const rabFields = x => [{ name: 'uraian', label: 'Uraian', required: true, full: true, value: x?.uraian }, { name: 'volume', label: 'Volume', type: 'number', required: true, value: x?.volume ?? 1 }, { name: 'satuan', label: 'Satuan', value: x?.satuan }, { name: 'harga', label: 'Harga satuan (Rp)', type: 'number', required: true, value: x?.harga }, { name: 'sumber', label: 'Sumber dana', value: x?.sumber, hint: 'Mis. iuran, sponsor, hibah' }];
const progFields = p => { const kor = is('koordinator'); return [{ name: 'nama', label: 'Nama program', required: true, full: true, value: p?.nama }, { name: 'jenis', label: 'Jenis program', type: 'select', options: kor ? [['bidang', 'Program per bidang']] : [['strategis', 'Program strategis'], ['tahunan', 'Program tahunan'], ['bidang', 'Program per bidang']], value: p?.jenis || ui.progTab }, { name: 'bidangId', label: 'Bidang (untuk program bidang)', type: 'select', options: kor ? [[me().bidangId, bidang(me().bidangId)]] : optBidang('—'), value: p?.bidangId }, { name: 'tahun', label: 'Tahun program', type: 'select', options: daftarTahun().map(t => [t, t]), value: p?.tahun || ui.tahun, hint: 'Tidak dipakai untuk program strategis (lintas tahun)', full: true }, { name: 'sasaran', label: 'Sasaran / target', full: true, value: p?.sasaran }, { name: 'deskripsi', label: 'Deskripsi', type: 'textarea', value: p?.deskripsi }]; };
const progSave = (p, v) => { if (v.jenis === 'bidang' && !v.bidangId) return 'Pilih bidang untuk program per bidang.'; Object.assign(p, v, { tahun: v.jenis === 'strategis' ? '' : v.tahun, bidangId: v.jenis === 'bidang' ? v.bidangId : '' }); ui.progTab = v.jenis; if (v.jenis !== 'strategis') setTahun(v.tahun); };
const agFields = a => [{ name: 'judul', label: 'Judul agenda', required: true, full: true, value: a?.judul }, { name: 'jenis', label: 'Jenis', type: 'select', options: ['Rapat', 'Pelatihan', 'Kegiatan'].map(x => [x, x]), value: a?.jenis }, { name: 'bidangId', label: 'Bidang', type: 'select', options: optBidang('Semua / pengurus inti'), value: a?.bidangId }, { name: 'tanggal', label: 'Tanggal', type: 'date', required: true, value: a?.tanggal || today() }, { name: 'waktu', label: 'Waktu', type: 'time', value: a?.waktu }, { name: 'tempat', label: 'Tempat', full: true, value: a?.tempat }];
const userFields = (u, baru) => [{ name: 'nama', label: 'Nama', required: true, value: u?.nama }, ...(baru ? [{ name: 'email', label: 'Email', type: 'email', value: '' }] : []), { name: 'role', label: 'Peran', type: 'select', options: Object.entries(ROLE), value: u?.role || 'koordinator' }, { name: 'bidangId', label: 'Bidang (ketua bidang)', type: 'select', options: optBidang('—'), value: u?.bidangId }, { name: 'aktif', label: 'Status', type: 'select', options: [['1', 'Aktif'], ['0', 'Nonaktif / menunggu']], value: u ? (u.aktif ? '1' : '0') : '1' }];
const userSave = (u, v) => { if (v.role === 'koordinator' && !v.bidangId) return 'Ketua bidang harus memiliki bidang.'; Object.assign(u, v, { aktif: v.aktif === '1', bidangId: v.role === 'koordinator' ? v.bidangId : '' }); };

async function readFile(file) {
  const asUrl = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
  if (file.type.startsWith('image/')) {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    const s = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.75);
  }
  return asUrl(file);
}

const A = {
  // profil
  orgEdit: () => { const o = db.org; form('Sunting profil organisasi', [{ name: 'nama', label: 'Nama organisasi', required: true, full: true, value: o.nama }, { name: 'alamat', label: 'Alamat', full: true, value: o.alamat }, { name: 'email', label: 'Email', value: o.email }, { name: 'telepon', label: 'Telepon', value: o.telepon }, { name: 'periode', label: 'Periode kepengurusan', value: o.periode }, { name: 'batasPengajuan', label: 'Batas pengajuan program kerja', type: 'date', value: o.batasPengajuan }, { name: 'visi', label: 'Visi', type: 'textarea', value: o.visi }, { name: 'misi', label: 'Misi (satu butir per baris)', type: 'textarea', value: o.misi }, { name: 'adart', label: 'Ringkasan AD/ART', type: 'textarea', value: o.adart }], v => { Object.assign(db.org, v); }); },
  strukAdd: () => strukForm(), strukEdit: ({ id }) => strukForm(db.org.struktur.find(s => s.id === id)),
  strukDel: ({ id }) => { if (yakin('Hapus jabatan ini?')) { rm(db.org.struktur, id); done(); } },
  // tahun
  tahunAdd: () => form('Tambah tahun program kerja', [{ name: 'tahun', label: 'Tahun', type: 'number', min: 2000, max: 2100, required: true, full: true, value: Number(daftarTahun().slice(-1)[0]) + 1, hint: 'Tahun dibuka untuk penyusunan program dan usulan kegiatan. Tahun tersimpan di daftar setelah ada program atau kegiatan di dalamnya.' }], v => { if (!Number.isInteger(v.tahun) || v.tahun < 2000 || v.tahun > 2100) return 'Isi tahun antara 2000 dan 2100.'; setTahun(v.tahun); }, 'Buka tahun'),
  // program
  progTab: ({ id }) => { ui.progTab = id; render(); },
  progAdd: () => form('Program baru', progFields(), v => { const p = { id: uid() }; const e = progSave(p, v); if (e) return e; db.program.push(p); }),
  progEdit: ({ id }) => { const p = db.program.find(x => x.id === id); form('Ubah program', progFields(p), v => progSave(p, v)); },
  progDel: ({ id }) => { if (db.kegiatan.some(k => k.programId === id)) return toast('Program masih dipakai oleh kegiatan.', true); if (yakin('Hapus program ini?')) { rm(db.program, id); done(); } },
  // kegiatan & alur
  kegAdd: () => kegForm(), kegEdit: ({ id }) => kegForm(keg(id)),
  kegDel: ({ id }) => { if (yakin('Hapus usulan kegiatan ini?')) { rm(db.kegiatan, id); location.hash = '#/pengajuan'; done('Usulan dihapus'); } },
  ajukan: ({ id }) => { const k = keg(id); if (!(k.indikator || []).length) return toast('Lengkapi minimal satu indikator keberhasilan sebelum mengajukan.', true); if (!(k.rab || []).length && !yakin('RAB masih kosong. Ajukan tanpa anggaran?')) return; k.status = 'diajukan'; log(k, 'Diajukan ke sekretariat'); done('Usulan diajukan'); },
  verif: ({ id }) => catatan('Verifikasi usulan', c => { const k = keg(id); k.status = 'diverifikasi'; log(k, 'Diverifikasi sekretariat, diteruskan ke ketua', c); }, false),
  revisi: ({ id }) => catatan('Minta revisi', c => { const k = keg(id); k.status = 'revisi'; log(k, 'Dikembalikan untuk revisi', c); }),
  tolak: ({ id }) => catatan('Tolak usulan', c => { const k = keg(id); k.status = 'ditolak'; log(k, 'Ditolak', c); }),
  sahkan: ({ id }) => catatan('Setujui dan sahkan', c => { const k = keg(id), y = k.mulai.slice(0, 4), n = db.kegiatan.filter(x => x.nomor && x.mulai.slice(0, 4) === y).length + 1; k.status = 'disetujui'; k.nomor = `${String(n).padStart(3, '0')}/KPMIK/PK/${y}`; log(k, `Disetujui dan disahkan (No. ${k.nomor})`, c); }, false),
  mulai: ({ id }) => { const k = keg(id); k.status = 'berjalan'; log(k, 'Pelaksanaan dimulai'); done('Kegiatan dimulai'); },
  progres: ({ id }) => { const k = keg(id); form('Perbarui progres', [{ name: 'progres', label: 'Progres (%)', type: 'number', max: 100, required: true, value: k.progres }, { name: 'c', label: 'Keterangan', type: 'textarea' }], v => { if (v.progres > 100) return 'Maksimal 100%.'; k.progres = v.progres; log(k, `Progres diperbarui menjadi ${v.progres}%`, v.c); }); },
  selesai: ({ id }) => { const k = keg(id); if (!yakin('Tandai kegiatan selesai? Progres menjadi 100%.')) return; k.status = 'selesai'; k.progres = 100; log(k, 'Kegiatan selesai'); done(hasLaporan(k) ? 'Kegiatan selesai' : 'Kegiatan selesai — jangan lupa unggah laporan'); },
  // indikator
  indAdd: ({ id }) => form('Indikator baru', indFields(), v => { keg(id).indikator.push({ id: uid(), ...v, realisasi: 0 }); }),
  indEdit: ({ id, sub: s }) => { const i = sub(keg(id), 'indikator', s); form('Ubah indikator', indFields(i), v => { Object.assign(i, v); }); },
  indDel: ({ id, sub: s }) => { rm(keg(id).indikator, s); done(); },
  indReal: ({ id, sub: s }) => { const i = sub(keg(id), 'indikator', s); form('Realisasi indikator', [{ name: 'realisasi', label: `${i.nama} — target ${i.target} ${i.satuan}`, type: 'number', required: true, full: true, value: i.realisasi }], v => { i.realisasi = v.realisasi; log(keg(id), `Realisasi “${i.nama}”: ${v.realisasi} ${i.satuan}`); }); },
  // rab & realisasi
  rabAdd: ({ id }) => form('Baris RAB', rabFields(), v => { keg(id).rab.push({ id: uid(), ...v }); }),
  rabEdit: ({ id, sub: s }) => { const x = sub(keg(id), 'rab', s); form('Ubah baris RAB', rabFields(x), v => { Object.assign(x, v); }); },
  rabDel: ({ id, sub: s }) => { rm(keg(id).rab, s); done(); },
  realAdd: ({ id }) => form('Realisasi biaya', [{ name: 'tanggal', label: 'Tanggal', type: 'date', required: true, value: today() }, { name: 'jumlah', label: 'Jumlah (Rp)', type: 'number', required: true }, { name: 'uraian', label: 'Uraian', required: true, full: true }], v => { const k = keg(id); (k.realisasi = k.realisasi || []).push({ id: uid(), ...v }); log(k, `Realisasi biaya ${rp(v.jumlah)}`, v.uraian); }),
  realDel: ({ id, sub: s }) => { if (yakin('Hapus catatan realisasi ini?')) { rm(keg(id).realisasi, s); done(); } },
  // kendala
  kdAdd: ({ id }) => form('Catat kendala', [{ name: 'uraian', label: 'Kendala', type: 'textarea', required: true }], v => { const k = keg(id); (k.kendala = k.kendala || []).push({ id: uid(), tanggal: today(), uraian: v.uraian, tindakLanjut: '', status: 'terbuka' }); log(k, 'Kendala dicatat', v.uraian); }),
  kdEdit: ({ id, sub: s }) => { const x = sub(keg(id), 'kendala', s); form('Tindak lanjut kendala', [{ name: 'tindakLanjut', label: `Tindak lanjut — ${x.uraian}`, type: 'textarea', required: true, value: x.tindakLanjut }, { name: 'status', label: 'Status', type: 'select', options: ['terbuka', 'ditangani', 'selesai'].map(o => [o, o]), value: x.status }], v => { Object.assign(x, v); log(keg(id), 'Tindak lanjut kendala', v.tindakLanjut); }); },
  // agenda
  agAdd: () => form('Agenda baru', agFields(), v => { db.agenda.push({ id: uid(), ...v }); const d = D(v.tanggal); ui.cal = { y: d.getFullYear(), m: d.getMonth() }; }),
  agEdit: ({ id }) => { const a = db.agenda.find(x => x.id === id); form('Ubah agenda', agFields(a), v => { Object.assign(a, v); }); },
  agDel: ({ id }) => { if (yakin('Hapus agenda ini?')) { rm(db.agenda, id); done(); } },
  calNav: ({ id }) => { const d = new Date(ui.cal.y, ui.cal.m + Number(id), 1); ui.cal = { y: d.getFullYear(), m: d.getMonth() }; render(); },
  // dokumen
  docAdd: ({ id }) => form('Unggah dokumen', [{ name: 'judul', label: 'Judul dokumen', required: true, full: true }, { name: 'kategori', label: 'Kategori', type: 'select', options: KATEGORI.map(k => [k, k]) }, { name: 'kegiatanId', label: 'Terkait kegiatan', type: 'select', options: [['', '— umum —'], ...db.kegiatan.map(k => [k.id, k.nama])], value: id || '' }, { name: 'file', label: 'Berkas (maks ±700 KB)', type: 'file', full: true }, { name: 'url', label: 'atau tautan (Google Drive, dsb.)', type: 'url', full: true }], async v => {
    if (!v.file && !v.url) return 'Pilih berkas atau isi tautan.';
    const d = { id: uid(), judul: v.judul, kategori: v.kategori, kegiatanId: v.kegiatanId, url: v.url || '', namaBerkas: '', tanggal: today(), oleh: me().nama, olehId: st.uid, adaBerkas: false };
    if (v.file) { const data = await readFile(v.file); if (data.length > 950000) return 'Berkas terlalu besar (maks ±700 KB). Simpan di Google Drive lalu tempel tautannya.'; await S.fileSave(d.id, data); d.namaBerkas = v.file.name; d.adaBerkas = true; }
    db.dokumen.push(d);
  }, 'Unggah'),
  docOpen: async ({ id }) => {
    const d = db.dokumen.find(x => x.id === id);
    if (!d.adaBerkas) return window.open(d.url, '_blank', 'noopener');
    try { const data = await S.fileGet(d.id); if (!data) return toast('Berkas tidak ditemukan.', true); const blob = await (await fetch(data)).blob(), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; if (/^(image|application\/pdf)/.test(blob.type)) a.target = '_blank'; else a.download = d.namaBerkas; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); } catch (e) { toast(fbErr(e), true); }
  },
  docDel: async ({ id }) => { const d = db.dokumen.find(x => x.id === id); if (!yakin('Hapus dokumen ini?')) return; try { if (d.adaBerkas) await S.fileDel(id); } catch (e) { /* lanjut */ } rm(db.dokumen, id); done(); },
  // pengguna & bidang
  userAdd: () => form('Pengguna baru (demo)', userFields(null, true), v => { const u = { id: uid() }; const e = userSave(u, v); if (e) return e; db.users.push(u); }),
  userEdit: ({ id }) => { const u = db.users.find(x => x.id === id); form('Ubah pengguna', userFields(u), v => { if (id === st.uid && (v.role !== 'admin' || v.aktif !== '1')) return 'Anda tidak dapat mencabut hak admin dari akun sendiri.'; return userSave(u, v); }); },
  userDel: ({ id }) => { if (yakin(st.mode === 'demo' ? 'Hapus pengguna ini?' : 'Hapus profil pengguna ini? Ia tidak lagi dapat mengakses data. (Akun login-nya dapat dihapus di Firebase Console.)')) { rm(db.users, id); done(); } },
  bidAdd: () => form('Bidang baru', [{ name: 'nama', label: 'Nama bidang', required: true, full: true }], v => { db.bidang.push({ id: uid(), nama: v.nama }); }),
  bidEdit: ({ id }) => { const b = db.bidang.find(x => x.id === id); form('Ubah bidang', [{ name: 'nama', label: 'Nama bidang', required: true, full: true, value: b.nama }], v => { b.nama = v.nama; }); },
  bidDel: ({ id }) => { if (db.kegiatan.some(k => k.bidangId === id) || db.users.some(u => u.bidangId === id)) return toast('Bidang masih dipakai oleh kegiatan atau pengguna.', true); if (yakin('Hapus bidang ini?')) { rm(db.bidang, id); done(); } },
  resetDemo: () => { if (yakin('Kembalikan semua data ke contoh awal?')) S.resetDemo(); },
  // laporan
  lapXlsx: () => {
    const { p, ks, tot, rl } = lapData(), nama = `Laporan Proker ${p.label}`;
    const s1 = [[db.org.nama], [`Laporan Capaian Program Kerja — ${p.label}`], [], ['No', 'Kegiatan', 'Bidang', 'Program', 'Mulai', 'Selesai', 'Status', 'Progres (%)', 'Capaian indikator (%)', 'Anggaran (Rp)', 'Realisasi (Rp)', 'Serapan (%)', 'Kendala'],
    ...ks.map((k, i) => [i + 1, k.nama, bidang(k.bidangId), program(k.programId), k.mulai, k.selesai, ST[k.status][0], k.progres || 0, capaian(k) == null ? '' : Math.round(capaian(k)), angg(k), real(k), angg(k) ? Math.round(real(k) / angg(k) * 100) : 0, (k.kendala || []).map(x => x.uraian).join('; ')]), [], ['', 'Jumlah', '', '', '', '', '', '', '', tot, rl, tot ? Math.round(rl / tot * 100) : 0]];
    const s2 = [['Kegiatan', 'Indikator', 'Target', 'Realisasi', 'Satuan', 'Capaian (%)']]; ks.forEach(k => (k.indikator || []).forEach(i => s2.push([k.nama, i.nama, i.target, i.realisasi || 0, i.satuan, i.target ? Math.round(i.realisasi / i.target * 100) : 0])));
    const s3 = [['Kegiatan', 'Uraian', 'Volume', 'Satuan', 'Harga satuan', 'Jumlah', 'Sumber dana']]; ks.forEach(k => (k.rab || []).forEach(x => s3.push([k.nama, x.uraian, x.volume, x.satuan, x.harga, x.volume * x.harga, x.sumber])));
    const s4 = [['Bidang', 'Jumlah kegiatan', 'Capaian indikator (%)', 'Progres rata-rata (%)', 'Nilai', 'Predikat'], ...nilaiBidang(ks).map(x => [x.b.nama, x.n, x.c == null ? '' : Math.round(x.c), x.p == null ? '' : Math.round(x.p), x.nilai == null ? '' : Number(x.nilai.toFixed(1)), predikat(x.nilai)])];
    if (window.XLSX) { const wb = XLSX.utils.book_new(); [['Kegiatan', s1], ['Indikator', s2], ['Anggaran', s3], ['Penilaian Bidang', s4]].forEach(([n, r]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(r), n)); XLSX.writeFile(wb, nama + '.xlsx'); }
    else { const csv = s1.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'), a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = nama + '.csv'; a.click(); toast('Pustaka Excel tidak termuat — diekspor sebagai CSV.'); }
  },
  lapPdf: () => {
    const { p, ks, tot, rl } = lapData(), nb = nilaiBidang(ks).filter(x => x.n), ketua = (db.org.struktur || []).find(s => /^ketua/i.test(s.jabatan));
    $('#print').innerHTML = `<img class="kop" src="assets/kop.jpg" alt=""><h2>LAPORAN CAPAIAN PROGRAM KERJA</h2><div class="sub">${esc(p.label)} · dicetak ${tgl(today())}</div>
      <p>Jumlah kegiatan: <b>${ks.length}</b> (${ks.filter(k => k.status === 'selesai').length} selesai, ${ks.filter(k => k.status === 'berjalan').length} berjalan). Anggaran <b>${rp(tot)}</b>, realisasi <b>${rp(rl)}</b> (${pct(tot ? rl / tot * 100 : 0)}).</p>
      <h3>A. Capaian kegiatan</h3>${lapTable(ks, tot, rl) || '<p>Tidak ada kegiatan pada periode ini.</p>'}
      <h3>B. Penilaian bidang</h3>${table(['Bidang', 'Kegiatan', 'Capaian indikator', 'Progres rata-rata', 'Nilai', 'Predikat'], nb.map(x => `<tr><td>${esc(x.b.nama)}</td><td class="num">${x.n}</td><td class="num">${pct(x.c)}</td><td class="num">${pct(x.p)}</td><td class="num">${x.nilai.toFixed(1)}</td><td>${predikat(x.nilai)}</td></tr>`)) || '<p>–</p>'}
      <div class="ttd"><div>Jakarta, ${tgl(today())}<br>Ketua<br><br><br><br><b>${esc(ketua ? ketua.nama : '')}</b></div></div>`;
    window.print();
  },
  // sesi
  logout: () => S.logout(), menu: () => $('.side').classList.toggle('open'),
  authTab: ({ id }) => { ui.authTab = id; ui.authErr = ''; render(); },
  buatProfil: async () => { try { await S.ensureProfile(st.email.split('@')[0]); } catch (e) { toast(fbErr(e), true); } }
};
function strukForm(s) {
  form(s ? 'Ubah jabatan' : 'Jabatan baru', [{ name: 'jabatan', label: 'Jabatan', required: true, value: s?.jabatan }, { name: 'nama', label: 'Nama pejabat', required: true, value: s?.nama }, { name: 'level', label: 'Tingkat', type: 'select', options: [[1, 'Pimpinan'], [2, 'Pengurus inti'], [3, 'Ketua bidang']], value: s?.level || 3 }], v => { v.level = Number(v.level); if (s) Object.assign(s, v); else (db.org.struktur = db.org.struktur || []).push({ id: uid(), ...v }); });
}
const C = {
  tahun: el => { if (el.value === '+') { render(); return A.tahunAdd(); } setTahun(el.value); render(); },
  lapJenis: el => { ui.lap = { jenis: el.value, idx: 0 }; render(); }, lapIdx: el => { ui.lap.idx = Number(el.value); render(); },
  docKat: el => { ui.docKat = el.value; render(); }, monBidang: el => { ui.monBidang = el.value; render(); },
  userSwitch: el => S.switchUser(el.value)
};

/* ================= shell & routing ================= */
function vAuth() {
  const daftar = ui.authTab === 'daftar';
  return `<div class="center"><div class="card login"><img src="assets/logo.png" alt="Kolegium Perekam Medis dan Informasi Kesehatan"><h2 style="text-align:center;margin-bottom:4px">Sistem Informasi Program Kerja</h2><p class="muted small" style="text-align:center;margin:0 0 14px">Perencanaan, pelaksanaan, monitoring, dan evaluasi</p>
    <div class="tabs"><button class="${daftar ? '' : 'on'}" data-act="authTab" data-id="masuk">Masuk</button><button class="${daftar ? 'on' : ''}" data-act="authTab" data-id="daftar">Daftar</button></div>
    <form id="auth">${daftar ? `<label class="f">Nama lengkap<input name="nama" required></label>` : ''}<label class="f">Email<input name="email" type="email" required autocomplete="username"></label><label class="f">Kata sandi<input name="pw" type="password" required minlength="6" autocomplete="${daftar ? 'new-password' : 'current-password'}"></label>
    ${ui.authErr ? `<div class="err" style="margin:0">${esc(ui.authErr)}</div>` : ''}<button class="btn primary" style="justify-content:center">${daftar ? 'Daftar' : 'Masuk'}</button>
    ${daftar ? `<p class="small muted" style="margin:0">Pendaftar pertama menjadi Admin. Pendaftar berikutnya menunggu aktivasi oleh Admin.</p>` : `<button type="button" class="btn sm" id="lupa" style="align-self:center;border:0">Lupa kata sandi?</button>`}</form></div></div>`;
}
function vPending() {
  const p = st.profile;
  return `<div class="center"><div class="card login" style="text-align:center"><img src="assets/logo.png" alt=""><h2>${p ? 'Menunggu aktivasi' : 'Profil belum dibuat'}</h2><p class="muted">${p ? `Akun <b>${esc(st.email)}</b> sudah terdaftar. Admin perlu mengaktifkan akun dan menetapkan peran Anda sebelum dapat digunakan.` : `Akun <b>${esc(st.email)}</b> belum memiliki profil pengguna.`}</p><div class="btns" style="justify-content:center">${p ? '' : `<button class="btn primary" data-act="buatProfil">Buat profil</button>`}<button class="btn" data-act="logout">Keluar</button></div></div></div>`;
}
function daftarTahun() {
  const y = new Date().getFullYear(), r = [];
  for (let i = y - 1; i <= y + 5; i++) r.push(String(i));
  return [...new Set([...r, ui.tahun, ...db.kegiatan.map(k => (k.mulai || '').slice(0, 4)), ...db.program.map(p => p.tahun)])].filter(Boolean).sort();
}
function setTahun(t) { ui.tahun = String(t); ui.cal.y = Number(t); try { localStorage.setItem('pmik-tahun', ui.tahun); } catch (e) { /* abaikan */ } }
let migrated = false;
function migrasiBidang() {
  if (migrated || st.mode !== 'firebase' || !is('admin')) return;
  migrated = true; let ubah = false;
  S.BIDANG_LAMA.forEach((lama, i) => { const b = db.bidang.find(x => x.id === 'b' + (i + 1)); if (b && b.nama === lama) { b.nama = S.BIDANG_DEFAULT[i]; ubah = true; } });
  if (ubah && !(db.org.struktur || []).length) db.org.struktur = S.strukturBidang();
  if (ubah) S.commit();
}
function render() {
  const app = $('#app');
  if (!st.ready) { app.innerHTML = `<div class="center"><p class="muted">Memuat…</p></div>`; return; }
  if (!st.authed) { app.innerHTML = vAuth(); bindAuth(); return; }
  if (st.mode === 'firebase' && !(st.profile && st.profile.aktif)) { app.innerHTML = vPending(); return; }
  if (!st.loaded) { app.innerHTML = `<div class="center"><p class="muted">Memuat data…</p></div>`; return; }
  migrasiBidang();
  const [, route = 'dashboard', arg] = location.hash.split('/'), u = me();
  const nq = K().filter(k => (k.status === 'diajukan' && is('admin', 'sekretaris')) || (k.status === 'diverifikasi' && is('admin', 'ketua'))).length;
  const years = daftarTahun();
  const cur = route === 'kegiatan' ? 'pengajuan' : route;
  const y = window.scrollY, same = app.dataset.route === location.hash;
  app.dataset.route = location.hash;
  app.innerHTML = `<div class="shell"><aside class="side"><div class="brand"><img src="assets/logo.png" alt="Kolegium Perekam Medis dan Informasi Kesehatan"></div><div class="app-name">Sistem Informasi Program Kerja</div>
    <nav class="nav">${MENU.map(([k, l, i, d]) => `<a href="#/${k}" class="${cur === k ? 'on' : ''}" title="${d}">${ico(i)}<span>${l}</span>${k === 'persetujuan' && nq ? `<span class="badge">${nq}</span>` : ''}</a>`).join('')}</nav>
    <div class="foot">${esc(db.org.alamat || '')}<br>${esc(db.org.email || '')}</div></aside>
  <div class="main">${st.mode === 'demo' ? `<div class="demo"><b>Mode demo</b> — data contoh, tersimpan di browser ini saja. Isi <code>public/js/firebase-config.js</code> untuk memakai Firebase (lihat README).</div>` : ''}
    <header class="top"><button class="btn menu-btn" data-act="menu" aria-label="Menu">${ico('menu')}</button>
      <label class="small muted">Tahun <select data-change="tahun">${years.map(t => `<option ${t === ui.tahun ? 'selected' : ''}>${t}</option>`).join('')}<option value="+">+ Tambah tahun…</option></select></label><div class="sp"></div>
      ${st.mode === 'demo' ? `<label class="small muted">Masuk sebagai <select data-change="userSwitch">${db.users.filter(x => x.aktif).map(x => `<option value="${x.id}" ${x.id === st.uid ? 'selected' : ''}>${esc(x.nama)}</option>`).join('')}</select></label>` : `<div class="who"><b>${esc(u.nama)}</b><span class="small muted">${ROLE[u.role]}${u.role === 'koordinator' ? ' · ' + esc(bidang(u.bidangId)) : ''}</span></div><button class="btn sm" data-act="logout">Keluar</button>`}
    </header><main class="page">${route === 'kegiatan' ? vKegiatan(arg) : (V[route] || V.dashboard)()}</main></div></div>`;
  window.scrollTo(0, same ? y : 0);
}
function bindAuth() {
  const f = $('#auth'); if (!f) return;
  f.onsubmit = async e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(f));
    try { ui.authErr = ''; if (ui.authTab === 'daftar') await S.register(v.nama.trim(), v.email.trim(), v.pw); else await S.login(v.email.trim(), v.pw); }
    catch (ex) { ui.authErr = fbErr(ex); render(); }
  };
  const l = $('#lupa'); if (l) l.onclick = async () => { const em = f.elements.email.value.trim(); if (!em) return toast('Isi email terlebih dahulu.', true); try { await S.resetPassword(em); toast('Tautan atur ulang kata sandi dikirim ke email.'); } catch (ex) { toast(fbErr(ex), true); } };
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) { if (!e.target.closest('.side')) $('.side')?.classList.remove('open'); return; }
  const fn = A[t.dataset.act]; if (fn) fn(t.dataset);
});
document.addEventListener('change', e => { const n = e.target.dataset && e.target.dataset.change; if (n && C[n]) C[n](e.target); });
window.addEventListener('hashchange', render);
S.init(() => { if (!$('#dlg').open) render(); }, e => toast(fbErr(e), true)).catch(e => { $('#app').innerHTML = `<div class="center"><div class="card"><b>Gagal memuat Firebase.</b><p class="muted">${esc(fbErr(e))}</p></div></div>`; });
