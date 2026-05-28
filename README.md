# PresensiKu - Sistem Absensi Karyawan Multi-Verifikasi

Aplikasi absensi karyawan berbasis web dengan verifikasi berlapis untuk menjamin keakuratan kehadiran pegawai. Dibangun menggunakan **Next.js 14 (App Router)**, **Prisma ORM**, **SQLite**, dan **Tailwind CSS**.

## Fitur Utama

1.  **Halaman Utama (Portal)**: Memisahkan akses masuk untuk Admin dan Karyawan.
2.  **Verifikasi NIP**: Karyawan memvalidasi NIP mereka ke database sebelum presensi.
3.  **QR Code Dinamis (1-Time Use)**: Admin men-generate QR Code yang kedaluwarsa setiap 5 menit dan hanya bisa dipindai sekali pakai oleh satu karyawan.
4.  **Validasi GPS Geofencing**: Membatasi absensi hanya di dalam radius **100 meter** dari koordinat kantor terdaftar (`-7.797068, 110.370529` - Area Yogyakarta).
5.  **Foto Selfie Native**: Karyawan mengambil foto selfie menggunakan kamera perangkat secara real-time.
6.  **Admin Dashboard**:
    *   Statistik kehadiran hari ini (Total Karyawan, Hadir, Terlambat).
    *   Manajemen data karyawan (Tambah/Hapus Karyawan).
    *   Laporan absensi lengkap beserta koordinat GPS, tautan Google Maps, status kehadiran (Tepat Waktu/Terlambat), dan zoom foto selfie.

---

## Panduan Instalasi & Menjalankan Aplikasi

Berikut adalah tata cara untuk menyalin (clone/pull) kode proyek dan menjalankannya di komputer lokal Anda.

### Cara 1: Menggunakan Node.js & Prisma (Rekomendasi)

**Prasyarat**: Pastikan Anda sudah menginstal **Node.js (versi >= 20.9.0)** dan **Git** di komputer Anda.

1.  **Clone Repository**:
    Buka terminal (Command Prompt / PowerShell / Terminal) lalu jalankan perintah berikut:
    ```bash
    git clone https://github.com/Davinsry/metopen-presensi.git
    ```
2.  **Masuk ke Direktori Proyek**:
    ```bash
    cd metopen-presensi
    ```
3.  **Install Dependensi**:
    ```bash
    npm install
    ```
4.  **Sinkronisasi Database SQLite**:
    Perintah ini akan membaca skema Prisma, membuat file database `prisma/dev.db` baru, dan menginisialisasi tabel-tabel absensi secara otomatis.
    ```bash
    npx prisma migrate dev --name init
    ```
5.  **Jalankan Server Development**:
    ```bash
    npm run dev
    ```
6.  **Akses Aplikasi**:
    Buka browser web Anda dan kunjungi: **[http://localhost:3000](http://localhost:3000)**

---

### Cara 2: Menggunakan Docker (Praktis Tanpa Install Node.js)

**Prasyarat**: Pastikan aplikasi **Docker Desktop** sudah terinstal dan aktif di komputer Anda.

1.  **Clone Repository**:
    ```bash
    git clone https://github.com/Davinsry/metopen-presensi.git
    ```
2.  **Masuk ke Direktori Proyek**:
    ```bash
    cd metopen-presensi
    ```
3.  **Build Docker Image**:
    Perintah ini akan merakit image kontainer lokal bernama `metopen-presensi` (termasuk instalasi package dan build Next.js di dalam kontainer Linux Alpine).
    ```bash
    docker build -t metopen-presensi:latest .
    ```
4.  **Jalankan Kontainer**:
    Jalankan kontainer di latar belakang (detached mode) dan petakan ke port `3000`:
    ```bash
    docker run -d -p 3000:3000 --name absensi metopen-presensi:latest
    ```
5.  **Akses Aplikasi**:
    Buka browser web Anda dan kunjungi: **[http://localhost:3000](http://localhost:3000)**

---

## Panduan Singkat Uji Coba Absensi (Testing)

Untuk melakukan pengujian alur absensi secara mandiri tanpa harus berada di lokasi kantor asli:

1.  **Registrasi Karyawan**:
    *   Buka **`http://localhost:3000/admin/karyawan`**.
    *   Tambahkan karyawan baru (contoh: NIP: `12345`, Nama: `Budi Santoso`, Jabatan: `Staff IT`).
2.  **Generate QR Code**:
    *   Buka **`http://localhost:3000/admin`**.
    *   Klik **"Aktifkan QR Code Absensi"**. Anda akan melihat QR Code beserta Token UUID-nya muncul di layar.
3.  **Proses Absen Karyawan**:
    *   Buka **`http://localhost:3000/absen`** di tab/perangkat lain.
    *   **Langkah 1**: Masukkan NIP `12345`.
    *   **Langkah 2**: Scan QR Code dengan kamera. Jika menguji pada desktop/laptop tanpa kamera belakang, klik **"Hubungkan secara Manual (Untuk Testing)"** lalu paste token UUID yang tampil di halaman Admin.
    *   **Langkah 3**: Sistem akan mengambil lokasi GPS. Karena Anda kemungkinan berada di luar radius kantor (100 meter), sistem akan mendeteksi jarak jauh. Klik tombol **"Gunakan Mock GPS Kantor (Testing Berhasil)"** untuk menyimulasikan koordinat kantor agar lolos verifikasi lokasi.
    *   **Langkah 4**: Ambil foto selfie Anda menggunakan kamera depan.
    *   **Langkah 5**: Review data dan klik **"Kirim Absensi"**.
4.  **Lihat Laporan**:
    *   Kembali ke panel admin dan buka **`http://localhost:3000/admin/laporan`**. Anda dapat melihat riwayat kehadiran Budi Santoso beserta waktu check-in, map link, status, dan foto selfie-nya.
