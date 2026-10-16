# Spesifikasi Sistem — AgriLoop AI

## 1. Ruang lingkup

Spesifikasi ini mendefinisikan sistem konseptual untuk MVP: ingest data wilayah, catatan pasokan, profil lot, penilaian kondisi tentatif, permintaan buyer, matching, dan pencatatan hasil aktual. Implementasi teknologi tertentu belum dipilih.

## 2. Modul logis

1. **Data ingestion:** impor data agregat wilayah/musim dan data pengguna dengan validasi skema serta asal-usul.
2. **Supply estimation:** hitung rentang potensi residu per area-periode dari statistik produksi dan faktor residu yang terdokumentasi; satelit opsional untuk indikator area/fenologi setelah validasi.
3. **Lot service:** CRUD status lot, kuantitas dan unit, waktu, lokasi dengan kontrol akses, foto dan persetujuan.
4. **Quality assessment:** pipeline validasi gambar, preprocessing, fitur tabular, model/fallback, confidence, abstention, versi model.
5. **Matching:** filter kelayakan keras terlebih dahulu (residu, kuantitas minimum, waktu, geografi), kemudian ranking berdasarkan skor transparan.
6. **Logistics planning:** pengelompokan/urutan pickup sederhana; biaya bersifat estimasi hingga tarif aktual tersedia.
7. **Feedback/evaluation:** simpan estimasi, nilai aktual, penerimaan buyer, alasan penolakan, koreksi manusia, serta versi aturan/model.
8. **Access and audit:** autentikasi, role-based access, audit log, izin media, retensi dan ekspor/penghapusan sesuai kebijakan.

## 3. Entitas dan skema minimum

| Entitas                | Field inti                                                                                                                        | Catatan                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `SupplyEstimate`       | `area_id`, `crop`, `period_start`, `period_end`, `quantity_low`, `quantity_high`, `unit`, `method_version`, `created_at`          | Semua nilai estimasi menyimpan metode dan interval, bukan angka pasti |
| `Lot`                  | `lot_id`, `owner_id`, `residue_type`, `crop`, `harvest_date`, `quantity`, `unit`, `ready_at`, `location`, `status`, `consent_ref` | Koordinat presisi dibatasi sesuai kebutuhan/izin                      |
| `ConditionObservation` | `lot_id`, `image_ref`, `storage`, `days_since_harvest`, `moisture_value?`, `moisture_method?`, `annotator_id`, `observed_at`      | Nilai opsional tidak boleh diisi dengan angka rekaan                  |
| `Assessment`           | `lot_id`, `model_version`, `schema_version`, `class`, `confidence?`, `abstained`, `created_at`                                    | Simpan keluaran model terpisah dari inspeksi manusia                  |
| `BuyerRequirement`     | `buyer_id`, `residue_type`, `quantity_min`, `quantity_max?`, `time_window`, `location`, `specification_ref`                       | Spesifikasi disediakan/diotorisasi buyer                              |
| `Match`                | `lot_id`, `requirement_id`, `eligibility_reasons`, `score_components`, `status`                                                   | Skor harus dapat dijelaskan dan dapat dilewati manual                 |
| `TransactionRecord`    | `lot_id`, `actual_quantity?`, `unit`, `pickup_at?`, `accepted?`, `rejection_reason?`, `verified_by?`                              | Ground truth operasional setelah verifikasi                           |

## 4. Fitur tabular untuk penilaian kondisi

| Fitur                              | Tipe                      | Sumber              | Kebijakan                                                            |
| ---------------------------------- | ------------------------- | ------------------- | -------------------------------------------------------------------- |
| `residue_type` / `crop`            | kategori                  | pengguna/verifikasi | Label eksplisit, kategori unknown diizinkan                          |
| `days_since_harvest`               | numerik                   | hitung dari tanggal | Simpan tanggal dan zona waktu sumber                                 |
| `storage_type`                     | kategori                  | pengguna/inspektur  | Gunakan pilihan terdefinisi dan `unknown`                            |
| `rain_exposure` / `ground_contact` | kategori/boolean          | pengguna/inspektur  | Jangan menebak dari lokasi                                           |
| `moisture_pct`                     | numerik opsional          | alat ukur           | Catat metode, alat, timestamp; jangan imputasi sebagai observasi     |
| `foreign_matter_observed`          | label terstruktur         | inspektur/pengguna  | Pisahkan observasi dari keluaran model gambar                        |
| `quantity`, `unit`                 | numerik + unit            | pengguna/timbang    | Validasi unit dan konversi; bukan fitur mutu utama tanpa justifikasi |
| `image_quality`                    | skor/flag                 | preprocessing       | Blur/gelap/tertutup dapat memicu pengambilan ulang/abstain           |
| `area_id`, `season`                | kategori/geospasial kasar | deklarasi/estimasi  | Periksa bias geografis; lokasi tepat tidak wajib untuk mutu          |

**Target klasifikasi:** kategori kondisi yang disepakati melalui protokol label lokal. Jangan mencampur target `jenis residu` dengan target `kondisi/kecocokan pemakaian`. Label keamanan, nilai nutrisi, atau kadar air tidak boleh dikeluarkan kecuali ada pengukuran dan validasi yang relevan.

## 5. Strategi estimasi pasokan

Potensi teoritis dapat dihitung dari produksi tanaman dan faktor residu yang memiliki sumber/metode. Estimasi yang dapat dikumpulkan secara ekonomi harus memperhitungkan bagian yang tertinggal di lahan, penggunaan lain, akses, kualitas, waktu, dan biaya angkut. Pada MVP, lebih aman menampilkan rentang indikatif dan tingkat bukti daripada satu angka presisi. Data satelit tidak langsung mengukur berat residu yang dapat dijual.

## 6. API konseptual

Rute ini kontrak konseptual, bukan endpoint yang sudah dibangun:

- `GET /supply-estimates?area=&crop=&period=` — estimasi dan metadata.
- `POST /lots` / `PATCH /lots/{id}` — buat dan perbarui lot.
- `POST /lots/{id}/observations` — tambah fitur tabular dan referensi gambar berizin.
- `POST /lots/{id}/assessments` — jalankan penilaian tentatif dan simpan versi model.
- `GET /matches?lot_id=` — kandidat buyer beserta kriteria/skor.
- `POST /matches/{id}/decision` — terima/tolak dan alasan.
- `POST /transactions` — catat kuantitas aktual dan penyelesaian.

Semua endpoint memerlukan otorisasi, validasi, idempotensi untuk operasi yang dapat diulang, dan audit perubahan status.

## 7. Matching dan logistik

Lakukan filter keras atas jenis bahan, waktu, volume minimum, dan batas area. Ranking MVP dapat memakai komponen berbobot yang ditampilkan, seperti kecocokan spesifikasi, jarak indikatif, jendela waktu, dan ukuran lot. Bobot belum ditetapkan. Biaya angkut baru menjadi angka estimasi jika tarif, kapasitas, dan sumber jarak tersedia. Optimasi rute tingkat lanjut ditunda.

## 8. Evaluasi model dan sistem

### Pasokan

Bandingkan estimasi dengan kuantitas aktual terverifikasi per area dan jendela waktu; gunakan MAE/WAPE dan interval coverage. Laporkan juga kesalahan untuk wilayah/jenis residu terpisah. Hindari random split yang mencampur musim atau lokasi yang sama ke train/test.

### Kondisi jerami

Bandingkan tabular-only, image-only, dan multimodal pada split yang dikelompokkan menurut petani/lahan dan waktu. Laporkan macro-F1, balanced accuracy, confusion matrix, calibration, abstention rate, dan hasil antar-subkelompok. Buat adjudikasi label dan kesepakatan antarpenilai sebelum klaim mutu.

### Marketplace/logistik

Ukur pencocokan yang menjadi pickup selesai, waktu, jarak/biaya aktual per ton, penerimaan/penolakan, dan pembatalan. Bandingkan dengan baseline manual jika tersedia.

### Evaluasi keselamatan/penggunaan

Pastikan model tidak memberi label meyakinkan saat foto buruk/fitur kritis hilang; ukur pengguna yang memahami bahwa estimasi bukan stok pasti dan grade bukan sertifikasi.

## 9. Privasi dan keamanan

- Minta persetujuan terpisah untuk lokasi, foto, dan penggunaan data untuk pelatihan.
- Simpan lokasi minimum yang diperlukan; batasi akses berdasarkan peran dan kebutuhan operasional.
- Pisahkan data identitas dari dataset analitik; gunakan pengenal pseudonim untuk eksperimen.
- Definisikan retensi, pencabutan izin, penghapusan media, audit akses, serta prosedur insiden sebelum pilot.
- Hindari publikasi titik petani atau harga individual tanpa persetujuan.

## 10. Risiko teknis dan mitigasi

| Risiko                                 | Dampak                            | Mitigasi                                                        |
| -------------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| Estimasi wilayah dianggap stok pasti   | Ekspektasi/kontrak gagal          | Rentang, provenance, tanggal, tingkat keyakinan, konfirmasi lot |
| Dataset foto kecil/berbias             | Generalisasi buruk                | Pilot multi-kondisi, split kelompok, baseline manual, abstain   |
| Grade tidak sesuai buyer lokal         | Penolakan/transaksi gagal         | Profil spesifikasi per buyer; validasi ahli; keluaran tentatif  |
| Fitur tabular hilang/tidak akurat      | Bias penilaian                    | Skema `unknown`, validasi, fallback dan indikator kelengkapan   |
| Angka/label dummy dianggap data nyata  | Klaim menyesatkan                 | Watermark/label simulasi pada UI dan dataset demo               |
| Peta terlalu presisi mengekspos petani | Risiko privasi                    | Agregasi, akses terbatas, izin dan lokasi kasar                 |
| Tidak ada ekonomi pengumpulan          | Matching tidak berujung transaksi | Catat biaya aktual; validasi pembeli/logistik sejak fase 0      |

## 11. Kriteria penerimaan MVP

- Demo dapat membedakan `estimasi`, `dikonfirmasi`, dan `aktual terverifikasi`.
- Setiap listing memiliki unit, timestamp, status, dan asal nilai.
- Foto buruk/kurang konteks dapat masuk jalur inspeksi manual.
- Matching menunjukkan alasan kelayakan dan tidak menjanjikan biaya yang tak didukung data.
- Semua contoh fiktif diberi label `DATA DUMMY / SIMULASI`.
- Problem statement hanya menggunakan angka yang memiliki kutipan/referensi langsung.
