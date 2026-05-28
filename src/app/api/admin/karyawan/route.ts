import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Ambil semua karyawan
export async function GET() {
  try {
    const karyawan = await prisma.karyawan.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(karyawan);
  } catch (error: any) {
    console.error("Error fetching karyawan:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data karyawan" },
      { status: 500 }
    );
  }
}

// POST: Tambah karyawan baru
export async function POST(request: Request) {
  try {
    const { nip, nama, jabatan } = await request.json();

    if (!nip || !nama || !jabatan) {
      return NextResponse.json(
        { error: "NIP, nama, dan jabatan harus diisi" },
        { status: 400 }
      );
    }

    // Cek apakah NIP sudah terdaftar
    const existingKaryawan = await prisma.karyawan.findUnique({
      where: { nip },
    });

    if (existingKaryawan) {
      return NextResponse.json(
        { error: "Karyawan dengan NIP ini sudah terdaftar" },
        { status: 400 }
      );
    }

    const newKaryawan = await prisma.karyawan.create({
      data: {
        nip,
        nama,
        jabatan,
      },
    });

    return NextResponse.json(newKaryawan, { status: 201 });
  } catch (error: any) {
    console.error("Error creating karyawan:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan karyawan" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus karyawan berdasarkan ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get("id");

    if (!idStr) {
      return NextResponse.json(
        { error: "ID karyawan diperlukan" },
        { status: 400 }
      );
    }

    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID karyawan tidak valid" },
        { status: 400 }
      );
    }

    // Gunakan Prisma transaction untuk menghapus absensi terkait terlebih dahulu
    // karena relasi database SQLite akan menolak penghapusan Karyawan yang memiliki Absensi
    await prisma.$transaction(async (tx) => {
      // Hapus semua absensi terkait karyawan
      await tx.absensi.deleteMany({
        where: { karyawanId: id },
      });

      // Hapus karyawan
      await tx.karyawan.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Karyawan berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting karyawan:", error);
    return NextResponse.json(
      { error: "Gagal menghapus karyawan" },
      { status: 500 }
    );
  }
}
