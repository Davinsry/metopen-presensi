import { NextResponse } from "next/server";
import crypto from "crypto";
import QRCode from "qrcode";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    // Generate unique token using crypto.randomUUID()
    const token = crypto.randomUUID();

    // Set token expiration to now + 5 minutes
    const now = new Date();
    const expiredAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes in milliseconds

    // Save token to QRToken table
    const qrTokenRecord = await prisma.qRToken.create({
      data: {
        token,
        expiredAt,
      },
    });

    // Generate base64 QR image from the token
    // The toDataURL function returns a string containing the image data URL
    const qrImageBase64 = await QRCode.toDataURL(token, {
      errorCorrectionLevel: "H",
      width: 400,
      margin: 2,
      color: {
        dark: "#1e1b4b", // Dark indigo
        light: "#ffffff", // White background
      },
    });

    return NextResponse.json({
      token: qrTokenRecord.token,
      expiredAt: qrTokenRecord.expiredAt,
      qrImageBase64,
    });
  } catch (error: any) {
    console.error("Error generating QR Token:", error);
    return NextResponse.json(
      { error: "Gagal membuat QR Token baru" },
      { status: 500 }
    );
  }
}
