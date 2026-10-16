# Panduan Web MVP — AgriLoop AI

Dokumen ini menjadi brief implementasi untuk website demo. Gunakan Next.js, TypeScript, dan gaya flat design. Jangan mengubah produk menjadi klaim bahwa hasil estimasi satelit adalah stok aktual atau bahwa penilaian visual merupakan sertifikasi mutu.

## Tujuan demo

Pengunjung harus dapat memahami masalah residu pascapanen, melihat cara kerja AgriLoop AI, dan mencoba satu alur contoh dari peta pasokan indikatif sampai pencatatan pengumpulan. Semua angka, listing, pembeli, harga, dan transaksi yang dibuat untuk demo harus diberi label **DATA DUMMY / SIMULASI**.

## Teknologi

- Next.js dengan App Router dan TypeScript.
- CSS Modules atau Tailwind CSS; pilih satu saja agar gaya tetap ringan.
- Motion graphics dengan Framer Motion (`motion`) atau Motion for React untuk transisi dan animasi kecil.
- Peta sederhana dapat memakai komponen peta yang sudah dipilih tim; untuk demo tanpa tile server, tampilkan peta sampel statis dari grid satelit.
- Dataset raster dipersiapkan sebelum runtime web dan disimpan sebagai aset demo/tiles ringan; jangan memanggil Earth Engine langsung dari browser atau membocorkan credential.

## Halaman dan struktur konten

### 1. Landing page

Landing page satu halaman dengan section berikut:

1. **Hero:** judul “Ubah sisa panen menjadi peluang” dan penjelasan ringkas bahwa AgriLoop membantu petani dan pembeli menemukan jalur pemanfaatan residu. CTA: “Lihat cara kerja” dan “Jelajahi demo”.
2. **Masalah:** residu dapat terbuang atau dibakar, sementara pembeli sulit mengetahui lokasi, waktu, jumlah, dan kondisi pasokan. Sampaikan dengan bahasa sederhana tanpa menyalahkan petani.
3. **Workflow AgriLoop:** satu section khusus yang menggambarkan lima langkah: perkiraan area/waktu → konfirmasi informasi oleh petani → pemeriksaan kondisi → pencocokan pembeli dan pengangkut → pencatatan hasil aktual.
4. **Demo peta:** beberapa grid contoh dengan tanggal citra, tombol/slider bulan, legenda dan label “data sampel demo”. Jangan tampilkan koordinat ladang pribadi.
5. **Nilai bagi tiap pihak:** petani, agregator, pembeli, dan pengangkut.
6. **Batasan/kepercayaan:** estimasi satelit bukan stok yang sudah diverifikasi; pemeriksaan kondisi awal bukan sertifikasi; ketersediaan dan transaksi perlu dikonfirmasi.
7. **CTA akhir/footer:** ajakan untuk ikut pilot dan tautan dokumentasi/sumber data.

### 2. Demo aplikasi

Satu alur yang bisa dicoba tanpa backend produksi:

- Peta/grid dan komposit bulanan.
- Daftar lot contoh dengan jenis residu, jumlah, tanggal siap, status dan kondisi.
- Detail lot dengan foto contoh dan informasi tambahan yang tersedia (mis. tanggal panen dan cara penyimpanan).
- Kartu penilaian awal dengan status “perlu pemeriksaan” bila gambar/data tidak cukup.
- Daftar kebutuhan buyer dan alasan kecocokan.
- Form simulasi untuk mencatat hasil pickup/kuantitas aktual.

Gunakan fixture lokal JSON bertanda dummy. Pisahkan fixture dari komponen visual agar kelak dapat diganti API.

## Arah visual flat design

- Bentuk datar, bidang warna solid, garis tipis, radius sederhana, tanpa tekstur/efek 3D.
- Palet yang tenang dan kontras: hijau tanaman, krem/putih hangat untuk latar, cokelat tanah sebagai aksen, dan warna status yang tetap mudah dibedakan.
- Tipografi sans-serif yang mudah dibaca; hierarki jelas antara judul, isi, data, dan status.
- Gunakan ikon sederhana dengan satu keluarga ikon yang konsisten.
- Layout lapang, kartu sederhana, data dan status lebih menonjol daripada dekorasi.
- Desain responsif dan nyaman digunakan pada layar ponsel; pastikan kontras, fokus keyboard, dan label form terbaca.

## Motion graphics

Gunakan gerakan untuk menjelaskan alur, bukan sebagai hiasan berulang:

- Hero: ilustrasi garis/partikel halus yang mengalir dari lahan ke titik pengumpulan/pembeli.
- Workflow: tiap langkah muncul berurutan ketika section masuk viewport.
- Peta: transisi lembut saat bulan/layer berganti; legenda tetap stabil.
- Kartu lot: perubahan status dengan animasi singkat.
- Hormati `prefers-reduced-motion`; sediakan versi tanpa animasi, hindari parallax berlebihan, dan jangan menghalangi interaksi.

## Struktur komponen yang disarankan

```text
app/
  page.tsx                 # Landing page
  demo/page.tsx            # Demo interaktif
  layout.tsx
components/
  SiteHeader.tsx
  Hero.tsx
  ProblemSection.tsx
  WorkflowSection.tsx
  SatelliteGridDemo.tsx
  LotCard.tsx
  MatchCard.tsx
  TrustNotes.tsx
  SiteFooter.tsx
data/
  demo-lots.json           # Semua data contoh diberi flag demo
  satellite-samples.json   # Aset, tanggal, sumber, bounds, band dan catatan
public/
  satellite/               # PNG/web tiles hasil preprocessing, bukan data privat
```

Struktur ini panduan awal, bukan persyaratan arsitektur final. Jaga komponen sederhana dan gunakan server components secara default; jadikan bagian demo interaktif sebagai client components seperlunya.

## Skema data demo minimum

```ts
type DemoLot = {
  id: string;
  residueType: string;
  quantity: number;
  unit: "ton" | "kg" | "bale";
  readyDate: string;
  status: "estimated" | "confirmed" | "matched" | "collected";
  conditionLabel?: string;
  additionalInfo?: { harvestDate?: string; storage?: string; image?: string };
  isDemo: true;
};
```

Data sampel satelit harus mencantumkan sumber dataset, tanggal awal/akhir, area/grid, band, metode komposit, cloud mask, dan batasan penggunaannya.

## Definisi selesai

- Landing page memuat seluruh section di atas, termasuk workflow yang jelas.
- Pengunjung dapat membuka demo, mengganti tanggal komposit, melihat listing simulasi, dan menelusuri satu match sampai pickup tercatat.
- Penanda dummy tampil di setiap permukaan demo yang menampilkan angka.
- Tampilan mobile dan desktop dapat dibaca; animasi memiliki dukungan reduced-motion.
- Sumber citra satelit dan keterbatasannya terlihat tanpa perlu membaca kode.
- Tidak ada kredensial Earth Engine di repo/browser dan tidak ada klaim mutu/stok pasti.

## Referensi produk

- [Ringkasan eksekutif](../research/executive-summary.md)
- [Problem statement dan sumber](../research/problem-statement.md)
- [Dataset satelit dan rancangan sampel](../research/satellite-dataset.md)
- [PRD](../PRD.md)
- [Spesifikasi sistem](../spec/system-spec.md)
