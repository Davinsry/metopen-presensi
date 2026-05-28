-- CreateTable
CREATE TABLE "Karyawan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nip" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "QRToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" DATETIME NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Absensi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "karyawanId" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "foto" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'HADIR',
    CONSTRAINT "Absensi_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Karyawan_nip_key" ON "Karyawan"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "QRToken_token_key" ON "QRToken"("token");
