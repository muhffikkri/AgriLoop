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
