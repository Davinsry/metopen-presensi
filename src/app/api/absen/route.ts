import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Konstanta koordinat kantor
const KANTOR_LAT = -7.797068;
const KANTOR_LNG = 110.370529;
const RADIUS_METER = 100;

// Logika hitung jarak Haversine (meter)
function hitungJarak(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(request: Request) {
  try {
    const { nip, qrToken, latitude, longitude, foto } = await request.json();

    // Validasi parameter wajib
    if (!nip || !qrToken || latitude === undefined || longitude === undefined || !foto) {
      return NextResponse.json(
        { error: "Semua parameter harus diisi: NIP, QR Token, GPS, dan Foto Selfie" },
        { status: 400 }
      );
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json(
        { error: "Koordinat GPS tidak valid" },
        { status: 400 }
      );
    }

    // 1. Cek apakah NIP ada di tabel Karyawan
    const karyawan = await prisma.karyawan.findUnique({
      where: { nip },
    });

    if (!karyawan) {
      return NextResponse.json(
        { error: "NIP karyawan tidak terdaftar" },
        { status: 404 }
      );
    }

    // 2. Cek apakah qrToken ada, belum expired, dan belum dipakai
    const tokenRecord = await prisma.qRToken.findUnique({
      where: { token: qrToken },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "QR Code tidak valid atau palsu" },
        { status: 400 }
      );
    }

    if (tokenRecord.isUsed) {
      return NextResponse.json(
        { error: "QR Code sudah pernah digunakan" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now > tokenRecord.expiredAt) {
      return NextResponse.json(
        { error: "QR Code sudah expired (berlaku 5 menit)" },
        { status: 400 }
      );
    }

    // 3. Cek apakah koordinat GPS dalam radius 100 meter dari kantor
    const jarak = hitungJarak(KANTOR_LAT, KANTOR_LNG, latNum, lngNum);
    if (jarak > RADIUS_METER) {
      return NextResponse.json(
        { error: `Lokasi Anda terlalu jauh dari kantor (${Math.round(jarak)}m dari batas 100m)` },
        { status: 400 }
      );
    }

    // 4. Hitung status absensi (cutoff jam 08:00 pagi local time)
    // Dapatkan jam dan menit dari waktu lokal sekarang
    const localHour = now.getHours();
    const localMinute = now.getMinutes();

    let status = "HADIR";
    if (localHour > 8 || (localHour === 8 && localMinute > 0)) {
      status = "TERLAMBAT";
    }

    // 5. Simpan absensi dan tandai token sebagai terpakai
    const absensi = await prisma.$transaction(async (tx) => {
      // Buat data absensi baru
      const newAbsen = await tx.absensi.create({
        data: {
          karyawanId: karyawan.id,
          latitude: latNum,
          longitude: lngNum,
          foto, // base64 string
          qrToken,
          status,
        },
        include: {
          karyawan: {
            select: {
              nip: true,
              nama: true,
              jabatan: true,
            },
          },
        },
      });

      // Update status token QR menjadi sudah dipakai
      await tx.qRToken.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true },
      });

      return newAbsen;
    });

    return NextResponse.json({
      message: "Absensi berhasil disimpan!",
      status: absensi.status,
      jarakKantor: Math.round(jarak),
      data: absensi,
    });
  } catch (error: any) {
    console.error("Error submitting absensi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memproses absensi" },
      { status: 500 }
    );
  }
}
