# Aplikasi Kasir Pempek

Aplikasi Kasir Pempek lengkap dengan fitur manajemen stok, rekap harian/bulanan, dan ekspor ke Excel. Dibangun menggunakan Next.js (App Router), Tailwind CSS, dan Prisma ORM.

## Fitur Utama

- **Kasir (Main Page)**: 
  - Pemilihan kasir aktif.
  - Pencarian paket pempek.
  - Keranjang belanja dengan validasi stok bahan baku otomatis.
  - Metode pembayaran Tunai dan QRIS.
  - Checkout yang mengurangi stok secara atomik.
- **Inventori**: 
  - Monitoring stok bahan (Kapal Selam Kecil, Kapal Selam Besar, Lenjer, Moza).
  - Form penambahan stok.
  - Riwayat perubahan stok (Tambah/Kurang).
- **Laporan**:
  - Rekap harian (filter tanggal).
  - Rekap bulanan (filter bulan/tahun).
  - Total omzet dan total transaksi.
  - Ekspor data transaksi ke file Excel (.xlsx).
- **Admin Kasir**:
  - Manajemen daftar nama kasir.
- **Responsive Design**: Tampilan rapi di HP, Tablet, dan Laptop.

## Teknologi

- **Frontend**: Next.js (React) + Tailwind CSS.
- **Icons**: Lucide React.
- **Database**: Prisma ORM (Mendukung Postgres/Supabase/Neon).
- **Utils**: date-fns, xlsx, clsx, tailwind-merge.

## Cara Install & Jalankan Lokal

1. **Clone project**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set Environment Variables**:
   Buat file `.env` di root directory dan masukkan `DATABASE_URL` (Gunakan Postgres/Supabase).
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/db_pempek"
   ```
4. **Push Schema ke Database**:
   ```bash
   npx prisma db push
   ```
5. **Jalankan aplikasi**:
   ```bash
   npm run dev
   ```
6. Buka [http://localhost:3000](http://localhost:3000).

## Deployment ke Vercel

1. Push project ini ke GitHub.
2. Hubungkan repository GitHub ke **Vercel**.
3. Tambahkan Environment Variable `DATABASE_URL` di dashboard Vercel (disarankan menggunakan **Vercel Postgres** atau **Supabase**).
4. Klik **Deploy**.
5. Selesai!

## Mapping Stok Bahan Baku

| Paket | Harga | Bahan yang Berkurang |
|-------|-------|----------------------|
| Paket Hemat | 5k | 3 Kapal Selam Kecil |
| Paket Nyoba | 10k | 6 Kapal Selam Kecil |
| Paket Lenjer | 10k | 2 Lenjer |
| Paket Gembul | 10k | 1 Kapal Selam Besar |
| Paket Mantul | 15k | 1 Kapal Selam Besar + 1 Lenjer |
| Paket New Mozarella | 15k | 3 Moza |
| Paket Super Mantul | 20k | 1 Kapal Selam Besar + 2 Lenjer |
| Paket Super Duper Mantul | 25k | 1 Kapal Selam Besar + 2 Lenjer + 3 Kapal Selam Kecil |
