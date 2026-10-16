# Riset dan Problem Statement — AgriLoop AI

**Tanggal pemeriksaan sumber:** 16 Oktober 2026. **Konteks:** India; ini bukan estimasi khusus distrik pilot.

## Problem statement (dua paragraf)

Setelah panen, sisa tanaman seperti jerami belum selalu dimanfaatkan dengan baik. Sebagiannya dibiarkan atau dibakar—pembakaran menambah pencemaran udara—padahal sebagian residu masih dapat dijual atau digunakan untuk pakan, kompos, media jamur, dan bahan baku energi. Sebuah artikel ulasan di _Journal of Cereal Research_ memperkirakan India menghasilkan sekitar **686 juta ton residu tanaman bruto** dan sekitar **234 juta ton residu surplus per tahun**. Ini adalah perkiraan untuk seluruh India, bukan jumlah yang pasti tersedia untuk dijual di setiap daerah. [Singh & Mina, 2022](https://epubs.icar.org.in/index.php/JWR/article/view/123108/).

Pengumpulan dan penjualan residu membutuhkan kerja sama antara petani atau kelompok tani, agregator, industri pembeli, serta penyedia penyimpanan dan transportasi. Pemerintah India juga membuat program rantai pasok jerami padi yang melibatkan kelompok-kelompok tersebut dan mendukung kebutuhan mesin serta pengumpulan. Ini menunjukkan bahwa residu yang bernilai tetap memerlukan koordinasi agar bisa sampai ke pengguna. AgriLoop AI menawarkan cara untuk memperkirakan lokasi dan waktu ketersediaan, mengumpulkan informasi tambahan dari petani dan pemeriksaan lapangan, memberi gambaran awal tentang kondisi, lalu menghubungkan residu dengan pembeli dan pengangkut. Platform membantu koordinasi; jumlah, mutu, dan transaksi tetap perlu dikonfirmasi oleh pihak terkait. [Ministry of Agriculture & Farmers Welfare, 2023](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1936626&lang=2&reg=3).

## Mengapa angka ini dipakai dengan batasan

- **686 Mt bruto / 234 Mt surplus:** angka yang dilaporkan abstrak artikel ulasan 2022. `Surplus` bukan sama dengan jumlah yang bisa dikumpulkan secara ekonomis atau tersedia untuk satu buyer. Artikel menjelaskan jenis tanaman dan kontribusi negara bagian bervariasi serta merangkum perbedaan opsi/metodologi.
- **Insiden CAQM:** laporan primer lembaga publik. Perbandingan angka memberi konteks skala dan tren terdeteksi, bukan klaim dampak platform. Definisi insiden dan periode pemantauan harus dipertahankan saat dikutip.
- Tidak ada nilai pasar, pendapatan petani, persentase residu yang dapat dijual, akurasi model, atau klaim pengurangan emisi yang dibuat tanpa data sumber/pilot.

## Referensi terverifikasi

1. Singh, D. & Mina, U. (2022). “On and Off Farm Crop Residue Management: A brief review on Options, Benefits, Drawbacks, Limitations and Policy Interventions.” _Journal of Cereal Research_, 14(2). [Halaman artikel dan abstrak](https://epubs.icar.org.in/index.php/JWR/article/view/123108/). DOI: [10.25174/2582-2675/2022/123108](https://doi.org/10.25174/2582-2675/2022/123108). Sumber menyatakan estimasi 686 Mt bruto dan 234 Mt surplus per tahun.
2. Commission for Air Quality Management (CAQM). _Annual Report 2024–25_, bagian 6.6 “Abatement of Air Pollution from Crop Residue Burning”. [PDF resmi](https://caqm.nic.in/WriteReadData/LINKS/7bb814e6-844c-48b9-91cc-aa1909f9a7d8.pdf). Sumber menyatakan hitungan Punjab dan Haryana 2020–2024.
3. Ministry of Agriculture & Farmers Welfare, Government of India. (2023). “Government revises the Crop Residue Management guidelines enabling efficient ex-situ management of paddy straw generated in the States of Punjab, Haryana, UP and Delhi.” [Press Information Bureau](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1936626&lang=2&reg=3). Rujukan mengenai skema rantai pasok yang melibatkan petani/agregator dan industri.
4. Ministry of Environment, Forest and Climate Change, Government of India. _Annual Report 2023–24_. [PDF resmi](https://moef.gov.in/uploads/2023/05/Annual-Report-English-2023-24.pdf). Rujukan tambahan untuk opsi pemanfaatan paddy straw dan laporan insiden 2021–2023; angka tidak dipakai sebagai angka utama problem statement karena lebih lama.

## Pertanyaan riset untuk fase berikutnya

- Berapa bagian potensi residu yang benar-benar dapat dikumpulkan setelah kebutuhan penggunaan di lahan, akses, dan ongkos dihitung?
- Buyer lokal mensyaratkan mutu seperti apa untuk pakan, kompos, jamur, atau bioenergi, dan alat ukur apa yang dianggap valid?
- Apakah penggabungan citra dengan umur pascapanen, paparan hujan, penyimpanan, dan kadar air terukur meningkatkan kinerja atas baseline tabular-only/image-only?
- Dapatkah koordinasi menaikkan tingkat pickup selesai atau manfaat bersih petani dibanding proses yang berjalan sekarang?

## Catatan dummy

Semua contoh angka pada prototype (volume lot, harga, jarak, jumlah buyer/petani, confidence model, akurasi, jadwal dan estimasi biaya) harus ditandai **DATA DUMMY / SIMULASI** kecuali memiliki asal data dan verifikasi terdokumentasi. Angka publik di atas adalah konteks riset nasional dan bukan data transaksi pilot.
