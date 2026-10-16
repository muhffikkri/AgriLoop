# Rekomendasi Dataset Satelit untuk Demo AgriLoop AI

**Tujuan demo:** memperlihatkan bahwa pengamatan satelit dapat membantu melihat perubahan lahan dan vegetasi dari waktu ke waktu. Sampel ini **bukan** bukti bahwa satelit dapat mengukur stok jerami atau menentukan mutu jerami secara langsung.

## Pilihan utama: Sentinel-2 L2A Surface Reflectance

Gunakan koleksi **Harmonized Sentinel-2 MSI Level-2A Surface Reflectance** di Google Earth Engine (`COPERNICUS/S2_SR_HARMONIZED`). Koleksi ini menyediakan citra pantulan permukaan sejak 2017, resolusi 10 m untuk band tampak/NIR dan resolusi lebih rendah untuk sebagian band lain, dengan frekuensi kunjungan ulang sekitar lima hari. Data telah dikoreksi atmosfer dan koleksinya menyelaraskan perubahan rentang nilai pada pemrosesan setelah Januari 2022. [Katalog dataset resmi Google Earth Engine](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED).

**Kenapa dipilih:** datanya langsung berasal dari satelit, tersedia untuk India, punya detail cukup untuk peta demonstrasi lahan pertanian, serta memungkinkan perbandingan sebelum dan sesudah panen. Gunakan Google Earth Engine untuk memilih area dan tanggal, menutupi awan, membuat komposit, lalu mengekspor GeoTIFF kecil. Untuk unduhan produk mentah di luar Earth Engine, gunakan [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2); ketersediaan produk dan aksesnya berbeda menurut produk.

## Rancangan sampel yang disarankan

Karena distrik pilot belum ditetapkan, jangan mengunci koordinat atau mengklaim grid tertentu sebagai sawah. Gunakan rancangan ini setelah memilih lokasi bersama mitra:

| Keputusan      | Nilai awal untuk demo                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Area           | Satu blok/area kecil di distrik pilot Punjab yang dipilih bersama mitra; jika belum ada mitra, gunakan area publik yang jelas disebut sebagai contoh visual   |
| Grid           | Pilih 4–6 sel persegi berukuran 1 km × 1 km yang mencakup lahan pertanian dan beberapa kondisi sekitar; simpan batas/koordinat dan CRS                        |
| Periode contoh | 15 Agustus–30 November 2025, satu musim pascapanen yang telah selesai; ubah tahun setelah memeriksa cakupan citra bebas awan                                  |
| Waktu ringkas  | Buat komposit bulanan untuk Agustus, September, Oktober, dan November; tambahkan satu tampilan sebelum panen dan satu setelah panen jika citra layak tersedia |
| Band           | B2, B3, B4, B8 (10 m); B11 dan B12 (20 m, resampling hanya bila dibutuhkan dan dicatat)                                                                       |
| Turunan        | True-color RGB, false-color NIR, NDVI; NDMI dapat ditampilkan sebagai indikator kelembapan vegetasi permukaan, bukan kadar air jerami                         |
| Hasil ekspor   | GeoTIFF per komposit/grid untuk analisis; PNG/JPEG turunan untuk tampilan web; metadata tanggal, sumber, cloud mask, skala, dan batas grid                    |

**Catatan:** batas administrasi, lokasi padi, dan tanggal panen perlu dicek terhadap sumber lokal. Agustus–November adalah rentang kerja untuk menelusuri perubahan pada contoh musim Kharif, bukan kalender panen yang pasti berlaku di setiap desa.

### Cara memilih grid dengan benar

1. Tetapkan dahulu satu area pilot yang masuk akal bersama petani, enumerator, atau pembeli.
2. Buat grid kecil berukuran 1 km pada peta, kemudian pilih 4–6 sel yang tidak semuanya berada di satu jenis tutupan lahan.
3. Periksa citra RGB dan klasifikasi lahan yang tersedia; tandai sel sebagai “lahan pertanian terindikasi” hanya jika ada bukti yang mendukung.
4. Jangan menampilkan koordinat ladang atau nama petani tanpa persetujuan.
5. Tampilkan batas grid, tanggal komposit, dan label “sampel demo” di peta.

## Dataset pendamping

### Dynamic World — konteks tutupan lahan

Dynamic World menyediakan label dan probabilitas sembilan kelas tutupan lahan pada resolusi 10 m, diturunkan dari Sentinel-2, dengan arsip sejak Juni 2015. Kelas “crops” dapat membantu menyaring konteks pertanian, tetapi **tidak membedakan padi dari gandum** dan bukan label mutu residu. Tampilkan probabilitas atau tingkat keyakinannya, jangan memperlakukannya sebagai batas sawah pasti. [Katalog Dynamic World resmi](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_DYNAMICWORLD_V1).

### SICKLE — alternatif bila perlu sampel padi berlabel

Jika demo membutuhkan dataset padi yang sudah memiliki label untuk eksperimen klasifikasi, pertimbangkan **SICKLE**, dataset multi-sensor untuk budidaya padi di Delta Cauvery, Tamil Nadu, dengan data 2018–2021 dan anotasi seperti jenis tanaman, varietas, musim tanam, dan hasil. Wilayah dan periodenya terbatas, jadi dataset ini baik untuk eksperimen/ilustrasi padi, tetapi tidak mewakili Punjab atau wilayah pilot lain secara otomatis. Periksa persyaratan akses dan atribusi pada [repositori SICKLE](https://github.com/Depanshu-Sani/SICKLE) dan [paper WACV 2024](https://openaccess.thecvf.com/content/WACV2024/papers/Sani_SICKLE_A_Multi-Sensor_Satellite_Imagery_Dataset_Annotated_With_Multiple_Key_Cropping_Parameters_WACV_2024_paper.pdf).

## Prosedur pengambilan di Earth Engine

1. Buat akun/proyek Earth Engine dan buka Code Editor.
2. Gambar/import batas 4–6 grid, lalu filter koleksi `COPERNICUS/S2_SR_HARMONIZED` untuk batas dan tanggal yang dipilih.
3. Terapkan cloud/shadow mask menggunakan `SCL` atau `Cloud Score+`; jangan hanya mengandalkan persentase awan pada seluruh scene karena grid kecil dapat tertutup awan walau scene terlihat cukup cerah secara umum.
4. Buat komposit median/medoid per bulan. Simpan citra asli yang dipakai dan jumlah observasi valid per grid.
5. Hitung NDVI dari B8 dan B4. Catat skala reflektansi yang perlu dibagi 10.000 sebelum perhitungan.
6. Ekspor hanya area kecil ke Google Drive atau Cloud Storage sebagai GeoTIFF. Earth Engine juga mendukung ekspor gambar; patuhi kuota/ketentuan akses proyek.
7. Buat PNG web yang ringan beserta file metadata JSON/CSV yang menulis sumber, tanggal, grid, resolusi, band, metode komposit, dan catatan keterbatasan.

Untuk pengamatan awan/bayangan, katalog Sentinel-2 menyarankan dataset pendamping seperti [Cloud Score+](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_CLOUD_SCORE_PLUS_V1_S2_HARMONIZED) atau Sentinel-2 Cloud Probability; pilih satu metode dan dokumentasikan.

## Penggunaan pada web MVP

- Sajikan raster/tiles hasil ekspor sebagai **visualisasi statis** untuk demo; jangan menjalankan unduhan raster besar di browser.
- Tambahkan penggeser waktu atau tombol bulan untuk membandingkan komposit.
- Legenda peta menyebut warna RGB/NDVI, tanggal, skala, dan status sebagai indikasi satelit.
- Bila tampilkan angka luas, hitung hanya dari grid sampel dan label “sampel”, bukan proyeksi produksi/tonase.
- Hubungkan lapisan grid dengan listing pasokan contoh hanya melalui data demo yang diberi label simulasi.

## Ringkasan pilihan

Untuk MVP, mulai dengan **Sentinel-2 L2A Harmonized** pada 4–6 grid kecil dan empat komposit bulanan 2025. Tambahkan **Dynamic World** hanya untuk konteks kelas crops. Gunakan **SICKLE** jika tim memerlukan contoh data padi berlabel untuk eksperimen, dengan batasan wilayah Tamil Nadu. Tidak satu pun dataset tersebut sendirian mengukur jerami yang dapat dijual, kondisi tiap lot, atau harga pasar.
