import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Ambil semua data absensi dengan relasi karyawan
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tanggal = searchParams.get("tanggal"); // Format: YYYY-MM-DD

    let whereClause = {};

    if (tanggal) {
      // Validasi format tanggal YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(tanggal)) {
        // Buat batas waktu untuk hari tersebut dalam UTC
        // Menggunakan rentang 00:00:00.000 sampai 23:59:59.999
        const startDate = new Date(`${tanggal}T00:00:00.000Z`);
        const endDate = new Date(`${tanggal}T23:59:59.999Z`);
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          whereClause = {
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          };
        }
      } else {
        return NextResponse.json(
          { error: "Format tanggal tidak valid, gunakan YYYY-MM-DD" },
          { status: 400 }
        );
      }
    }

    const absensi = await prisma.absensi.findMany({
      where: whereClause,
      include: {
        karyawan: {
          select: {
            nip: true,
            nama: true,
            jabatan: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    return NextResponse.json(absensi);
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data laporan absensi" },
      { status: 500 }
    );
  }
}
