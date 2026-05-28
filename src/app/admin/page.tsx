"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalKaryawan: number;
  totalAbsenHariIni: number;
  totalTerlambatHariIni: number;
}

interface QRData {
  token: string;
  expiredAt: string;
  qrImageBase64: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalKaryawan: 0,
    totalAbsenHariIni: 0,
    totalTerlambatHariIni: 0,
  });
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingQR, setLoadingQR] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [formattedDate, setFormattedDate] = useState("");

  // Fetch stats from API
  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }

  // Generate new QR Token
  async function generateQR() {
    setLoadingQR(true);
    try {
      const res = await fetch("/api/qr/generate", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setQrData(data);
        // Hitung selisih waktu dalam detik
        const expTime = new Date(data.expiredAt).getTime();
        const nowTime = new Date().getTime();
        const seconds = Math.max(0, Math.floor((expTime - nowTime) / 1000));
        setTimeLeft(seconds);
      }
    } catch (error) {
      console.error("Error generating QR:", error);
    } finally {
      setLoadingQR(false);
    }
  }

  // Initialize and poll stats
  useEffect(() => {
    fetchStats();
    setFormattedDate(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    // Refresh statistik setiap 30 detik
    const statsInterval = setInterval(fetchStats, 30000);
    return () => clearInterval(statsInterval);
  }, []);

  // Timer countdown logic for QR Code expiration
  useEffect(() => {
    if (timeLeft <= 0) {
      if (qrData) {
        // Auto-refresh when timer hits 0
        generateQR();
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, qrData]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Percentage of timer remaining for progress bar
  const progressPercent = qrData ? (timeLeft / 300) * 100 : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">
            Ringkasan Dashboard
          </h2>
          <p className="text-slate-400 mt-1">
            Status kehadiran karyawan dan monitoring QR code absensi dinamis.
          </p>
        </div>
        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold text-indigo-400 self-start sm:self-auto">
          📅 {formattedDate}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        {/* Total Karyawan */}
        <div className="glass-panel glow-indigo p-6 rounded-2xl flex items-center justify-between hover:border-slate-800/80 transition-all">
          <div className="space-y-1">
            <span className="text-slate-400 text-sm font-medium">Total Karyawan</span>
            {loadingStats ? (
              <div className="h-8 w-12 bg-slate-800 animate-pulse rounded"></div>
            ) : (
              <h3 className="text-3xl font-extrabold text-slate-100">{stats.totalKaryawan}</h3>
            )}
            <span className="text-xs text-indigo-400">Pegawai terdaftar</span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.079-13.137a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm6 2.25a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
        </div>

        {/* Hadir Hari Ini */}
        <div className="glass-panel glow-emerald p-6 rounded-2xl flex items-center justify-between hover:border-slate-800/80 transition-all">
          <div className="space-y-1">
            <span className="text-slate-400 text-sm font-medium">Hadir Hari Ini</span>
            {loadingStats ? (
              <div className="h-8 w-12 bg-slate-800 animate-pulse rounded"></div>
            ) : (
              <h3 className="text-3xl font-extrabold text-slate-100">{stats.totalAbsenHariIni}</h3>
            )}
            <span className="text-xs text-emerald-400">Telah melakukan absen</span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
        </div>

        {/* Terlambat Hari Ini */}
        <div className="glass-panel glow-rose p-6 rounded-2xl flex items-center justify-between hover:border-slate-800/80 transition-all">
          <div className="space-y-1">
            <span className="text-slate-400 text-sm font-medium">Jumlah Terlambat</span>
            {loadingStats ? (
              <div className="h-8 w-12 bg-slate-800 animate-pulse rounded"></div>
            ) : (
              <h3 className="text-3xl font-extrabold text-slate-100">{stats.totalTerlambatHariIni}</h3>
            )}
            <span className="text-xs text-rose-400">Absen lewat dari 08:00</span>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="glass-panel p-8 rounded-2xl max-w-2xl mx-auto flex flex-col items-center text-center shadow-lg relative overflow-hidden">
        {/* QR background glow overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/5 blur-[50px] pointer-events-none"></div>

        <h3 className="text-xl font-bold text-slate-100 mb-2 relative z-10">QR Code Absensi Dinamis</h3>
        <p className="text-slate-400 text-sm max-w-md mb-8 relative z-10">
          Karyawan memindai QR Code ini menggunakan handphone mereka untuk memvalidasi token sesi absensi.
        </p>

        {qrData ? (
          <div className="w-full flex flex-col items-center space-y-6 relative z-10">
            {/* Base64 QR Image Container */}
            <div className="p-4 bg-white rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrData.qrImageBase64}
                alt="QR Code Absensi"
                className="w-64 h-64 md:w-72 md:h-72 object-contain"
              />
            </div>

            {/* Countdown timer & Progress bar */}
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                  Token aktif (UUID)
                </span>
                <span className="text-indigo-400 font-mono">
                  Segarkan dalam: {formatTime(timeLeft)}
                </span>
              </div>
              
              {/* Progress bar container */}
              <div className="w-full h-2 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/40">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Token String for debugging/manual display */}
            <div className="px-4 py-2 bg-slate-950/80 border border-slate-800/80 rounded-xl max-w-md w-full select-all">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold mb-0.5">Token ID</span>
              <span className="font-mono text-xs text-indigo-300 break-all">{qrData.token}</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={generateQR}
              disabled={loadingQR}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_4px_20px_-4px_rgba(99,102,241,0.4)] flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loadingQR ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menyegarkan...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Segarkan QR Sekarang
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center space-y-6 relative z-10">
            {/* Placeholder QR */}
            <div className="w-64 h-64 rounded-2xl bg-slate-950/80 border border-slate-800 border-dashed flex flex-col items-center justify-center text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 12v1.5m0 0v1.5m0-1.5h1.5m-1.5 0h-1.5M12 12v1.5m0 0v1.5m0-1.5h1.5m-1.5 0H10.5m4.5 4.5v1.5m0 0v1.5m0-1.5h1.5m-1.5 0h-1.5m-3-1.5v1.5m0 0v1.5m0-1.5h1.5m-1.5 0H9" />
              </svg>
              <span className="text-sm">QR Code belum aktif</span>
            </div>

            <button
              onClick={generateQR}
              disabled={loadingQR}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl font-bold text-base transition-all shadow-[0_4px_25px_-5px_rgba(99,102,241,0.5)] flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loadingQR ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Membuat QR...
                </>
              ) : (
                "Aktifkan QR Code Absensi"
              )}
            </button>
          </div>
        )}

        {/* Geolocation metadata for testing */}
        <div className="mt-6 pt-6 border-t border-slate-900 w-full text-left flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            📍 Koordinat Kantor Terdaftar: <span className="font-semibold text-slate-400 font-mono">-7.797068, 110.370529</span>
          </div>
          <div>
            🏢 Radius Maksimum: <span className="font-semibold text-emerald-500">100 meter</span>
          </div>
        </div>
      </div>
    </div>
  );
}
