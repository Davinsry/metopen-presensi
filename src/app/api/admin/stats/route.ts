import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Dapatkan batas waktu lokal hari ini (00:00:00 sampai 23:59:59)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [totalKaryawan, totalAbsenHariIni, totalTerlambatHariIni] = await Promise.all([
      // Total karyawan
      prisma.karyawan.count(),
      
      // Total absensi hari ini
      prisma.absensi.count({
        where: {
          timestamp: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),

      // Jumlah terlambat hari ini
      prisma.absensi.count({
        where: {
          timestamp: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: "TERLAMBAT",
        },
      }),
    ]);

    return NextResponse.json({
      totalKaryawan,
      totalAbsenHariIni,
      totalTerlambatHariIni,
    });
  } catch (error: any) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Gagal memuat statistik admin" },
      { status: 500 }
    );
  }
}
