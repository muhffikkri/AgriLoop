# Product Requirements Document — AgriLoop AI

## 1. Executive summary

AgriLoop AI mengoordinasikan keputusan pascapanen dengan menyatukan perkiraan lokasi/waktu/potensi residu, konfirmasi ketersediaan oleh petani atau agregator, pemeriksaan kondisi lot berbasis foto dan data tabular, serta pencocokan pembeli dan logistik. Platform diarahkan untuk mengurangi ketidakpastian operasional dalam pemanfaatan residu, bukan untuk mengklaim bahwa teknologi saja dapat menghapus pembakaran atau menjamin pendapatan petani.

## 2. Masalah dan peluang

Residu pertanian merupakan sumber daya dengan pilihan penggunaan yang beragam, tetapi nilai ekonominya bergantung pada tanaman, kondisi, lokasi, waktu, biaya pengumpulan, dan permintaan. Data inventarisasi nasional bersifat estimasi, sementara keputusan transaksi membutuhkan informasi lokal yang lebih aktual. [Latar dan angka yang dapat dikutip](research/problem-statement.md).

## 3. Pengguna dan pekerjaan yang ingin diselesaikan

| Pengguna                                 | Kebutuhan utama                                                            | Bukti keberhasilan                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Petani / kelompok tani                   | Menyatakan lot dan menemukan jalur pemanfaatan yang layak                  | Waktu dari listing ke penawaran; transaksi selesai; manfaat bersih yang dilaporkan |
| Agregator / operator pengumpulan         | Mengetahui area dan jendela panen, menggabungkan lot, merencanakan pickup  | Selisih estimasi vs aktual; pemanfaatan kapasitas; pembatalan                      |
| Pembeli (pakan, kompos, bioenergi, dll.) | Menemukan lot sesuai kebutuhan material, waktu, lokasi, dan mutu           | Waktu pencarian; tingkat penerimaan lot; pemenuhan pesanan                         |
| Enumerator / ahli mutu                   | Mengumpulkan bukti lot dan label yang konsisten                            | Kelengkapan data, kesepakatan antarpenilai                                         |
| Admin program                            | Melihat aktivitas dan kualitas data tanpa mengekspos data pribadi berlebih | Kelengkapan, audit, dan laporan agregat                                            |

## 4. Tujuan dan bukan tujuan

### Tujuan

- Menampilkan estimasi potensi pasokan per wilayah dan periode, beserta sumber dan tingkat keyakinan.
- Memperbarui estimasi dengan deklarasi ketersediaan dan catatan verifikasi.
- Membuat profil lot konsisten yang memuat jenis residu, kuantitas, lokasi, waktu, dan bukti kondisi.
- Menghasilkan saran pencocokan yang dapat dijelaskan berdasarkan kebutuhan pembeli serta biaya/jarak indikatif.
- Menguji apakah foto dan fitur tabular memberi manfaat tambahan dibanding masing-masing modalitas saja.

### Bukan tujuan MVP

- Sertifikasi mutu resmi atau rekomendasi keselamatan pakan tanpa protokol ahli.
- Estimasi emisi/polusi yang diklaim sebagai dampak kausal platform.
- Otomasi kontrak, pembayaran, kredit, asuransi, atau pelacakan armada real-time.
- Prediksi stok aktual hanya dari satelit.
- Model computer vision produksi sebelum tersedia dataset representatif dan izin penggunaan.

## 5. Fitur produk

1. **Peta potensi residu:** wilayah, tanaman, periode, estimasi rentang jumlah, tanggal pembaruan, sumber, dan tingkat keyakinan.
2. **Konfirmasi pasokan:** petani/agregator mengubah sinyal potensi menjadi lot yang ditawarkan dengan tanggal siap, kuantitas, lokasi kasar/tepat sesuai izin, dan status.
3. **Profil kondisi lot:** foto dengan panduan pengambilan dan fitur tabular; keluaran kelas kondisi tentatif, confidence, faktor penentu, dan opsi “perlu inspeksi”.
4. **Marketplace/matching:** filter kebutuhan material, volume, jendela waktu, radius, dan spesifikasi pembeli; biaya angkut hanya indikatif sampai ada tarif terverifikasi.
5. **Rencana pengumpulan:** pengelompokan lot dan urutan pickup sederhana berdasarkan jarak dan waktu.
6. **Rekam transaksi:** penawaran, penerimaan/penolakan beserta alasan, timbang/volume aktual, pickup, dan bukti serah-terima.
7. **Panel pemantauan:** funnel supply-to-use, kualitas data, kesalahan estimasi, dan indikator inklusi; tampilkan agregat.

## 6. Persyaratan produk utama

- Antarmuka mobile-first, hemat bandwidth, bahasa lokal dapat ditambahkan setelah lokasi pilot dipilih.
- Formulir lot harus menyimpan waktu, satuan, dan asal nilai (pengguna, sensor, estimasi, atau verifikasi).
- Setiap prediksi menampilkan waktu dibuat, horizon, ketidakpastian, dan keterbatasan.
- Pengguna dapat memperbaiki data dan menarik persetujuan sesuai kebijakan produk.
- Sistem harus tetap mendukung pemeriksaan manual saat gambar tidak tersedia, blur, atau model ragu.
- Data sensitif petani dan koordinat rinci tidak ditampilkan ke publik.

## 7. Indikator keberhasilan

Metrik berikut adalah **target yang harus ditetapkan setelah baseline pilot**, bukan hasil yang sudah dicapai:

- Supply: MAE/WAPE untuk volume aktual per area-periode; lead time; cakupan lot tervalidasi.
- Mutu: macro-F1 per kelas, balanced accuracy, confusion matrix, calibration, dan tingkat abstain.
- Matching/logistik: conversion to completed pickup, waktu pencocokan, jarak/biaya per ton, pembatalan.
- Adopsi/ekuitas: retensi pengguna, partisipasi kelompok kecil, perbedaan kinerja antarwilayah/perangkat.
- Data: kelengkapan fitur, duplikasi, label dispute, dan proporsi estimasi yang dikonfirmasi.

## 8. MVP hackathon

Demo satu alur wilayah terbatas: peta data contoh yang jelas berlabel simulasi → listing petani → unggah foto dan input tabular → tampilan penilaian tentatif/baseline → daftar pembeli contoh → rekomendasi pencocokan → catatan pickup aktual. Model boleh memakai baseline sederhana atau stub; jangan menyebut angka dummy sebagai kinerja nyata. Prioritas demonstrasi adalah alur keputusan, asal data, ketidakpastian, dan umpan balik manusia.

## 9. Asumsi, risiko, dan mitigasi

Lihat [design.md](design.md) untuk risiko produk serta [system-spec.md](spec/system-spec.md) untuk risiko data/model dan mitigasi teknis. Asumsi terpenting: ada mitra lokal yang bisa memvalidasi label, satu jenis residu dan satu geografi pilot yang cukup sempit, serta pembeli bersedia menyampaikan spesifikasi material.

## 10. Dependensi dan keputusan yang belum dibuat

- Negara bagian, distrik, bahasa, musim, tanaman dan residu prioritas.
- Definisi kelas kondisi/grade dan protokol penilaian lokal.
- Sumber citra dan dataset tabular yang sah digunakan; kepemilikan dan persetujuan.
- Satuan transaksi (kg/ton/bale), metode pengukuran, serta struktur tarif logistik.
- Mitra pembeli dan mekanisme verifikasi transaksi.

## 11. Roadmap

| Fase          | Fokus                                                                     | Gerbang keluar                                                            |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 0 — Validasi  | Wawancara, pilih geografi/tanaman, definisi label dan alur data           | Persetujuan mitra dan kamus data disepakati                               |
| 1 — MVP       | Listing, peta indikatif, form kondisi, matching aturan, catatan transaksi | Satu alur ujung-ke-ujung dapat didemokan dengan data berlabel             |
| 2 — Pilot     | Pengumpulan data lapangan, baseline supply dan grading, audit kesalahan   | Dataset berizin dan evaluasi held-out tersedia                            |
| 3 — Perluasan | Multimodal fusion tervalidasi, integrasi logistik/pembeli                 | Model mengalahkan baseline pada metrik yang disepakati dan aman digunakan |

## 12. Skenario pengguna dan alur bisnis

### Peran dan tanggung jawab

| Peran                  | Tujuan di sistem                                    | Aksi utama                                                                              |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Pengunjung             | Memahami solusi tanpa akun                          | Membaca landing page dan menjalankan walkthrough di `/demo`                             |
| Petani / kelompok tani | Menawarkan residu dan mengelola permintaan          | Membuat lot, mengisi jumlah/lokasi/waktu, menanggapi penawaran, menyiapkan pickup       |
| Pembeli                | Mengamankan pasokan sesuai kebutuhan                | Membuat kebutuhan, mencari lot, mengirim penawaran, mengonfirmasi penerimaan            |
| Agregator / pengangkut | Menggabungkan pasokan dan menyelesaikan pengumpulan | Mengambil pekerjaan, membentuk pickup, memperbarui jadwal, mencatat kuantitas terkumpul |
| Admin/operator         | Menjaga konfigurasi dan mutu operasi                | Mengelola akun/role, area dan grid demo, memeriksa sengketa/rekaman, melihat audit      |

Satu akun memiliki satu role utama pada MVP; role tambahan hanya diberikan admin. Buyer dapat mewakili organisasi. Admin tidak dapat didaftarkan sendiri oleh pengguna.

### Skenario 1 — Pengunjung melihat landing page dan workflow

1. Pengunjung membuka `/` dari ponsel atau desktop.
2. Hero menjelaskan AgriLoop dengan bahasa awam; CTA menuju `/#workflow` dan `/demo`.
3. Pengunjung membaca lima tahap sistem dan batas perkiraan satelit.
4. Pengunjung menekan “Coba demo” dan berpindah ke `/demo` tanpa login.

**Penerimaan:** alur dan batasan mudah dipahami; CTA bekerja; tampilan responsif.

### Skenario 2 — Pengunjung menjalankan walkthrough `/demo`

1. Pengunjung membuka `/demo` dan memilih sudut pandang Petani, Pembeli, Agregator, atau Admin dari persona switcher.
2. Walkthrough menunjukkan grid simulasi Punjab di atas layer citra Earth Engine, lengkap dengan periode dan sumber.
3. Pengunjung menjalankan langkah alur sesuai persona: petani membuat lot; buyer mencari dan mengirim minat; agregator menjadwalkan pickup; admin melihat status keseluruhan.
4. Perubahan status dan data bersifat simulasi lokal, dapat di-reset, dan tetap memiliki badge `DATA DUMMY / SIMULASI`.
5. Link “Buka area pengguna” menuju route role yang sesuai (bila mode akun tersedia), tanpa mengubah walkthrough publik.

**Penerimaan:** `/demo` tidak membutuhkan akun; persona dapat diganti; alur lintas peran terlihat; tidak ada transaksi/pesan sungguhan.

### Skenario 3 — Petani mendaftarkan dan menawarkan lot

1. Petani masuk ke `/login`; setelah autentikasi, sistem mengarahkannya ke `/farmer/dashboard`.
2. Petani membuka `/farmer/supply/new` dan mengisi jenis residu, kuantitas/satuan, perkiraan tanggal siap, lokasi (grid/area), tanggal panen, kondisi penyimpanan, foto opsional, serta catatan.
3. Petani menyimpan sebagai `Draft` atau menerbitkan sebagai `Open`.
4. Petani melihat lot di `/farmer/supply`, dapat memperbaiki atau menarik lot selama belum disepakati buyer.
5. Saat penawaran masuk, petani memeriksa detail dan memilih terima/tolak; terima mengunci lot untuk proses kesepakatan dan pickup.
6. Petani melihat jadwal pickup dan menandai kesiapan serah-terima.

**Validasi:** kuantitas positif dan unit wajib; tanggal siap tidak lebih awal dari tanggal hari ini; residu/lokasi wajib; foto opsional; lokasi detail hanya dibagikan kepada pihak transaksi yang berwenang.

**Penerimaan:** pengguna lain tidak dapat mengedit lot; status dan riwayat perubahan tampil; lot yang sudah dikontrak tidak dapat ditarik tanpa pembatalan tercatat.

### Skenario 4 — Pembeli membuat kebutuhan dan memesan pasokan

1. Buyer membuka `/buyer/requirements/new` dan mengisi jenis residu, rentang jumlah, jendela pengiriman, area/radius, spesifikasi kondisi dan pilihan substitusi.
2. Buyer menerbitkan kebutuhan; halaman `/buyer/matches` menampilkan lot yang lolos kriteria inti serta alasan ranking.
3. Buyer membuka `/buyer/marketplace/[lotId]`, meninjau data lokasi/kondisi sesuai izin, lalu mengirim inquiry/penawaran berisi jumlah, harga atau syarat transaksi, dan batas waktu.
4. Petani menerima/menolak atau mengajukan perubahan. Buyer meninjau respons dan mengonfirmasi kesepakatan.
5. Kesepakatan menghasilkan order yang dapat dilihat di `/buyer/orders/[orderId]`.
6. Setelah pickup, buyer memeriksa jumlah dan kondisi; buyer mencatat penerimaan atau membuka sengketa dengan alasan terstruktur.

**Penerimaan:** penawaran memiliki masa berlaku; satu lot tidak dapat memiliki dua order aktif yang saling tumpang tindih; keputusan dan perubahan syarat memiliki audit log.

### Skenario 5 — Agregator membentuk rencana pickup

1. Agregator melihat lot/order yang siap diambil di `/aggregator/available-lots`.
2. Agregator memilih beberapa pickup yang berada dalam jendela waktu dan area operasionalnya.
3. Agregator membuat rencana di `/aggregator/collections/new`, memilih tanggal, kendaraan/kapasitas, urutan berhenti, dan PIC.
4. Petani dan buyer terkait melihat status jadwal serta dapat mengonfirmasi kesiapan/penerimaan jadwal.
5. Di lapangan, agregator memperbarui setiap pickup ke `Picked Up`, mencatat kuantitas terukur, satuan, waktu, dan bukti serah-terima.
6. Buyer mengonfirmasi penerimaan; order ditutup atau beralih ke sengketa.

**Penerimaan:** kuantitas aktual dan satuan wajib saat pickup selesai; jadwal dapat diubah dengan alasan dan notifikasi; kapasitas kendaraan tidak boleh dilampaui oleh jumlah rencana.

### Skenario 6 — Admin memantau platform dan grid demo

1. Admin masuk ke `/admin/dashboard` dengan role admin.
2. Admin meninjau ringkasan jumlah akun, listing, penawaran, pickup dan sengketa.
3. Admin mengelola pengguna dan role di `/admin/users`, memblokir akses bila diperlukan, dan mencatat alasan.
4. Admin memperbarui area/grid simulasi serta metadata/periode citra di `/admin/grid-samples`; perubahan tidak memodifikasi citra sumber.
5. Admin meninjau kualitas data dan riwayat status di `/admin/data-quality` serta `/admin/audit-log`.

**Penerimaan:** admin-only routes ditolak untuk role lain; perubahan role dan status tercatat; tidak ada tindakan destruktif tanpa konfirmasi dan audit.

### Status bisnis

- **Lot:** `DRAFT → OPEN → RESERVED → PICKUP_SCHEDULED → PICKED_UP → ACCEPTED → CLOSED`.
- Cabang lot: `REJECTED`, `CANCELLED`, `EXPIRED`, `DISPUTED` dengan aktor, waktu, dan alasan.
- **Buyer requirement:** `DRAFT → OPEN → PARTIALLY_MATCHED/FULFILLED → CLOSED`, atau `CANCELLED`.
- **Pickup:** `PLANNED → CONFIRMED → IN_PROGRESS → COMPLETED`; cabang `RESCHEDULED` atau `FAILED` memerlukan catatan.
- Semua state machine divalidasi server-side pada implementasi nyata; demo `/demo` hanya menirukan urutan tersebut dengan data lokal.

## 13. Route map dan matriks akses

| Route               | Akses           | Tujuan                                                                      |
| ------------------- | --------------- | --------------------------------------------------------------------------- |
| `/`                 | Publik          | Landing dan workflow                                                        |
| `/demo`             | Publik          | Walkthrough interaktif end-to-end, persona switcher, grid simulasi Punjab   |
| `/login`, `/signup` | Publik          | Autentikasi dan pendaftaran petani/buyer/agregator                          |
| `/app`              | Login           | Mengarahkan pengguna ke dashboard berdasarkan role                          |
| `/farmer/*`         | Petani          | Pasokan, penawaran, pickup, riwayat, profil                                 |
| `/buyer/*`          | Buyer           | Kebutuhan, marketplace, match, order, profil organisasi                     |
| `/aggregator/*`     | Agregator       | Lot tersedia, pickup, rute sederhana, kapasitas dan riwayat                 |
| `/admin/*`          | Admin           | Pengguna, area/grid demo, moderasi, kualitas data, audit                    |
| `/api/*`            | Sesuai endpoint | Data dan mutasi role-protected; tidak boleh bergantung hanya pada UI gating |

### Halaman per role

- **Petani:** `/farmer/dashboard`, `/farmer/supply`, `/farmer/supply/new`, `/farmer/supply/[lotId]`, `/farmer/offers`, `/farmer/collections`, `/farmer/profile`.
- **Buyer:** `/buyer/dashboard`, `/buyer/requirements`, `/buyer/requirements/new`, `/buyer/marketplace`, `/buyer/marketplace/[lotId]`, `/buyer/matches`, `/buyer/orders`, `/buyer/orders/[orderId]`, `/buyer/profile`.
- **Agregator:** `/aggregator/dashboard`, `/aggregator/available-lots`, `/aggregator/collections`, `/aggregator/collections/new`, `/aggregator/collections/[collectionId]`, `/aggregator/routes`, `/aggregator/profile`.
- **Admin:** `/admin/dashboard`, `/admin/users`, `/admin/areas`, `/admin/grid-samples`, `/admin/transactions`, `/admin/data-quality`, `/admin/audit-log`.

Folder route groups boleh mengatur layout tanpa menambah segmen URL, misalnya `(public)`, `(auth)`, `(workspace)`. Route role tetap memakai prefiks di atas supaya mudah dipahami pengguna dan agent.

## 14. Checklist fitur dan skenario

### Public dan walkthrough

- [ ] Landing page punya hero, problem, workflow lima langkah, manfaat per pihak, batasan dan CTA.
- [ ] `/demo` terbuka tanpa login dan memiliki persona switcher Petani/Pembeli/Agregator/Admin.
- [ ] `/demo` memperlihatkan grid Punjab simulasi, pilihan periode/layer, sumber citra, metadata, dan badge dummy.
- [ ] Setiap persona menyelesaikan satu langkah nyata pada walkthrough; reset mengembalikan semua state.

### Akun, router, dan akses role

- [ ] `/login`, `/signup`, dan `/app` berfungsi untuk alur masuk dan redirect sesuai role.
- [ ] Tiap role memperoleh layout/sidebar dan dashboard sesuai pekerjaan.
- [ ] Role yang tidak sesuai tidak dapat melihat halaman maupun mengambil aksi yang dilarang.
- [ ] Server Actions dan Route Handlers memeriksa sesi, role, dan kepemilikan data.
- [ ] Admin tidak dapat didaftarkan melalui signup publik.
- [ ] Logout menghapus sesi dan mengarahkan ke halaman publik.

### Petani

- [ ] Membuat, menyimpan draft, menerbitkan, memperbarui, dan menarik listing sesuai status.
- [ ] Memeriksa penawaran dan menerima/menolak dengan alasan.
- [ ] Melihat jadwal pickup dan menyatakan kesiapan.
- [ ] Melihat riwayat transaksi miliknya tanpa data sensitif pengguna lain.

### Buyer

- [ ] Membuat/mengubah/membatalkan kebutuhan.
- [ ] Menelusuri filter marketplace dan membaca alasan match.
- [ ] Mengirim penawaran, menyepakati order, dan mengonfirmasi penerimaan.
- [ ] Membuka dispute dengan kategori alasan jika barang tidak sesuai.

### Agregator

- [ ] Melihat lot/order yang dapat dikerjakan.
- [ ] Membuat dan mengubah rencana pickup.
- [ ] Mencatat status, kuantitas aktual, unit, waktu dan bukti serah-terima.
- [ ] Tidak dapat melebihi kapasitas kendaraan yang dikonfigurasi.

### Admin

- [ ] Mengelola pengguna/role dengan audit log.
- [ ] Mengelola grid simulasi dan metadata citra tanpa mengubah sumber raster.
- [ ] Melihat transaksi/sengketa dan status data tanpa akses yang tidak perlu ke informasi privat.

### Kualitas, aksesibilitas, dan keamanan

- [ ] Flat design, mobile-first, label/form mudah dibaca dan dapat dipakai dengan keyboard.
- [ ] Animasi Motion menghormati `prefers-reduced-motion`.
- [ ] Loading, no-data, error, validation, forbidden, not-found dan empty state dirancang.
- [ ] Citra mencantumkan sumber, periode, CRS/resolusi, cloud mask dan status simulasi.
- [ ] Tidak ada credential Earth Engine di browser/repository/log.
- [ ] Mutasi transaksi mencatat aktor, waktu dan perubahan; nominal/kuantitas tervalidasi.
- [ ] Uji otorisasi per role untuk halaman, Server Actions dan API sebelum menyebut aplikasi siap.

## 15. Arsitektur Next.js

Rancangan lengkap ada di [web-mvp/architecture.md](web-mvp/architecture.md). Arsitektur harus mencakup public pages, route group autentikasi, workspace tiap role, `/demo`, DAL untuk pemeriksaan sesi/otorisasi, aturan status bisnis, dan storage sampel Earth Engine. Gunakan Server Components secara default; interaksi peta/form menjadi Client Components. Pemeriksaan role pada Proxy hanya optimasi navigasi—setiap halaman terlindungi, Server Action, dan Route Handler tetap melakukan pemeriksaan akses sendiri.
