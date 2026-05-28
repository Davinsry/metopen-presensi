"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const KANTOR_LAT = -7.797068;
const KANTOR_LNG = 110.370529;

export default function AbsenKaryawan() {
  const [step, setStep] = useState(1); // Steps: 1, 2, 3, 4, 5
  const [nip, setNip] = useState("");
  const [karyawanInfo, setKaryawanInfo] = useState<{ nama: string; jabatan: string } | null>(null);
  const [checkingNip, setCheckingNip] = useState(false);
  const [nipError, setNipError] = useState("");

  // Step 2: QR Token
  const [qrToken, setQrToken] = useState("");
  const [manualTokenMode, setManualTokenMode] = useState(false);
  const [qrError, setQrError] = useState("");
  const qrReaderRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<any>(null);

  // Step 3: GPS
  const [gpsLoading, setGpsLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isMockGps, setIsMockGps] = useState(false);
  const [gpsError, setGpsError] = useState("");

  // Step 4: Selfie Photo
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fotoBase64, setFotoBase64] = useState<string>("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Step 5: Submit
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    status?: string;
    jarakKantor?: number;
  } | null>(null);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopSelfieKamera();
      stopQRScanner();
    };
  }, []);

  // Logika hitung jarak Haversine (meter)
  function hitungJarak(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // --- STEP 1: Verify NIP ---
  async function handleVerifyNip(e: React.FormEvent) {
    e.preventDefault();
    setNipError("");
    if (!nip.trim()) {
      setNipError("NIP tidak boleh kosong!");
      return;
    }

    setCheckingNip(true);
    try {
      // Kita panggil API karyawan untuk mencocokkan NIP
      const res = await fetch("/api/admin/karyawan");
      if (res.ok) {
        const karyawanList = await res.json();
        const found = karyawanList.find((k: any) => k.nip === nip.trim());
        if (found) {
          setKaryawanInfo({ nama: found.nama, jabatan: found.jabatan });
          setStep(2);
        } else {
          setNipError("NIP Karyawan tidak terdaftar di sistem!");
        }
      } else {
        setNipError("Gagal memvalidasi NIP ke database.");
      }
    } catch (error) {
      setNipError("Terjadi kesalahan koneksi server.");
    } finally {
      setCheckingNip(false);
    }
  }

  // --- STEP 2: QR Scanner ---
  async function startQRScanner() {
    setQrError("");
    setManualTokenMode(false);

    try {
      // Import html5-qrcode secara dinamis untuk mencegah SSR error
      const { Html5Qrcode } = await import("html5-qrcode");
      
      // Tunggu DOM dimuat
      setTimeout(() => {
        if (!qrReaderRef.current) return;
        
        const scanner = new Html5Qrcode("qr-reader");
        scannerInstanceRef.current = scanner;

        scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            // Berhasil scan QR Code
            setQrToken(decodedText);
            scanner.stop().then(() => {
              scannerInstanceRef.current = null;
              // Lanjut ke step GPS
              handleGpsStep(decodedText);
            }).catch(console.error);
          },
          (errorMessage) => {
            // error pemindaian biasa, abaikan saja
          }
        ).catch((err) => {
          console.error("Camera access error:", err);
          setQrError("Gagal mengakses kamera belakang. Silakan gunakan input manual.");
          setManualTokenMode(true);
        });
      }, 100);

    } catch (error) {
      console.error(error);
      setQrError("Tidak dapat memuat scanner.");
      setManualTokenMode(true);
    }
  }

  function stopQRScanner() {
    if (scannerInstanceRef.current && scannerInstanceRef.current.isScanning) {
      scannerInstanceRef.current.stop().then(() => {
        scannerInstanceRef.current = null;
      }).catch(console.error);
    }
  }

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrToken.trim()) {
      setQrError("Token tidak boleh kosong!");
      return;
    }
    stopQRScanner();
    handleGpsStep(qrToken.trim());
  };

  useEffect(() => {
    if (step === 2 && !manualTokenMode) {
      startQRScanner();
    } else {
      stopQRScanner();
    }
  }, [step, manualTokenMode]);

  // --- STEP 3: GPS Geolocation ---
  function handleGpsStep(token: string) {
    setStep(3);
    getGPSLocation(false); // Ambil lokasi GPS asli secara default
  }

  function getGPSLocation(mock: boolean) {
    setGpsLoading(true);
    setGpsError("");
    setIsMockGps(mock);

    if (mock) {
      // Mock koordinat kantor (dekat dengan kantor agar sukses)
      // Selisih koordinat sangat kecil agar dalam radius 100m
      const mockLat = -7.797050; 
      const mockLng = 110.370510;
      setLatitude(mockLat);
      setLongitude(mockLng);
      const dist = hitungJarak(KANTOR_LAT, KANTOR_LNG, mockLat, mockLng);
      setDistance(dist);
      setGpsLoading(false);
      // Auto transition ke Step 4 (Selfie) setelah delay sedikit
      setTimeout(() => {
        setStep(4);
        startSelfieKamera();
      }, 1000);
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Browser Anda tidak mendukung layanan lokasi (GPS).");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        const dist = hitungJarak(KANTOR_LAT, KANTOR_LNG, lat, lng);
        setDistance(dist);
        setGpsLoading(false);
        // Auto transition ke Step 4 setelah 1.5 detik
        setTimeout(() => {
          setStep(4);
          startSelfieKamera();
        }, 1500);
      },
      (error) => {
        console.error("GPS Error:", error);
        let msg = "Gagal mengambil lokasi GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Izin lokasi ditolak oleh Anda. Silakan izinkan akses GPS atau gunakan opsi mock.";
        }
        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // --- STEP 4: Selfie Photo ---
  async function startSelfieKamera() {
    setCameraError("");
    setFotoBase64("");
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Selfie camera error:", err);
      setCameraError("Gagal mengakses kamera depan untuk selfie. Pastikan izin kamera aktif.");
      setCameraActive(false);
    }
  }

  function stopSelfieKamera() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  function ambilFotoSelfie() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.75);
      setFotoBase64(base64);
      stopSelfieKamera();
      // Transisi ke Step 5 (Review)
      setStep(5);
    }
  }

  // --- STEP 5: Submit Absen ---
  async function handleFinalSubmit() {
    if (!nip || !qrToken || latitude === null || longitude === null || !fotoBase64) {
      alert("Data tidak lengkap untuk disubmit.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/absen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nip,
          qrToken,
          latitude,
          longitude,
          foto: fotoBase64,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setResult({
          success: true,
          message: data.message,
          status: data.status,
          jarakKantor: data.jarakKantor,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Gagal melakukan absensi",
        });
      }
    } catch (error) {
      console.error(error);
      setResult({
        success: false,
        message: "Terjadi kesalahan server. Silakan coba lagi.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Reset all flow
  const handleReset = () => {
    setStep(1);
    setNip("");
    setKaryawanInfo(null);
    setQrToken("");
    setManualTokenMode(false);
    setLatitude(null);
    setLongitude(null);
    setDistance(null);
    setFotoBase64("");
    setResult(null);
    setIsMockGps(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#04060b]">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none animate-pulse-slow" style={{ animationDelay: "2s" }}></div>

      <div className="max-w-md w-full relative z-10">
        
        {/* Portal back button */}
        {step < 5 && !result && (
          <Link
            href="/"
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-300 mb-6 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 mr-1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Kembali ke Portal
          </Link>
        )}

        {/* Steper indicator */}
        {step <= 5 && !result && (
          <div className="flex items-center justify-between mb-8 px-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-initial">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                    step === s
                      ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                      : step > s
                      ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
                      : "bg-slate-900 text-slate-600 border-slate-800"
                  }`}
                >
                  {s}
                </div>
                {s < 5 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all ${
                      step > s ? "bg-emerald-500/30" : "bg-slate-800"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* STEP CARDS */}
        {!result ? (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl glow-emerald relative overflow-hidden transition-all duration-300">
            {/* Step 1: Input NIP */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-100">Verifikasi NIP</h2>
                  <p className="text-slate-400 text-sm mt-1">Masukkan Nomor Induk Pegawai Anda untuk memulai absensi.</p>
                </div>

                {nipError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                    ⚠️ {nipError}
                  </div>
                )}

                <form onSubmit={handleVerifyNip} className="space-y-4">
                  <div>
                    <label htmlFor="nip-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Nomor Induk Pegawai
                    </label>
                    <input
                      id="nip-input"
                      type="text"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      placeholder="Masukkan NIP Anda"
                      className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-200 placeholder:text-slate-700 text-center text-lg font-mono tracking-widest focus:outline-none transition-colors"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={checkingNip}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {checkingNip ? "Memverifikasi..." : "Verifikasi NIP"}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Scan QR */}
            {step === 2 && (
              <div className="space-y-6 flex flex-col items-center">
                <div className="text-center w-full">
                  <h2 className="text-2xl font-bold text-slate-100">Scan QR Code</h2>
                  <p className="text-slate-400 text-sm mt-1">Arahkan kamera ke QR Code di layar admin kantor.</p>
                </div>

                {qrError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl w-full">
                    ⚠️ {qrError}
                  </div>
                )}

                {!manualTokenMode ? (
                  <div className="w-full space-y-4">
                    {/* QR Finder Overlays */}
                    <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-black">
                      <div id="qr-reader" ref={qrReaderRef} className="w-full h-full object-cover"></div>
                      
                      {/* Laser scanning overlay line */}
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-bounce"></div>
                    </div>

                    <button
                      onClick={() => setManualTokenMode(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors mx-auto block"
                    >
                      Hubungkan secara Manual (Untuk Testing)
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleManualTokenSubmit} className="space-y-4 w-full">
                    <div>
                      <label htmlFor="token-manual" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Token QR Code (Paste UUID)
                      </label>
                      <input
                        id="token-manual"
                        type="text"
                        value={qrToken}
                        onChange={(e) => setQrToken(e.target.value)}
                        placeholder="Paste Token UUID"
                        className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 placeholder:text-slate-700 text-center font-mono text-xs focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setQrError("");
                          setManualTokenMode(false);
                        }}
                        className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 rounded-xl font-semibold text-xs transition-colors"
                      >
                        Buka Kamera
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                      >
                        Lanjutkan
                      </button>
                    </div>
                  </form>
                )}

                <div className="w-full pt-4 border-t border-slate-900/60 text-center text-xs text-slate-500">
                  Karyawan: <span className="font-semibold text-slate-400">{karyawanInfo?.nama}</span>
                </div>
              </div>
            )}

            {/* Step 3: Geolocation (GPS) */}
            {step === 3 && (
              <div className="space-y-6 text-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">Verifikasi Lokasi</h2>
                  <p className="text-slate-400 text-sm mt-1">Mengambil koordinat satelit GPS handphone Anda.</p>
                </div>

                {gpsLoading ? (
                  <div className="py-10 flex flex-col items-center justify-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm text-slate-400">Menghubungi satelit GPS...</span>
                  </div>
                ) : gpsError ? (
                  <div className="space-y-4 py-4">
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl leading-relaxed text-left">
                      ⚠️ {gpsError}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => getGPSLocation(false)}
                        className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl font-semibold text-xs transition-colors"
                      >
                        Coba Lagi
                      </button>
                      <button
                        onClick={() => getGPSLocation(true)}
                        className="w-full py-2.5 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-400 rounded-xl font-bold text-xs transition-all"
                      >
                        Gunakan Mock GPS Kantor (Testing Berhasil)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Koordinat Terdeteksi</span>
                      <span className="font-mono text-sm text-slate-300">{latitude?.toFixed(6)}, {longitude?.toFixed(6)}</span>
                      {distance !== null && (
                        <div className="mt-2 text-sm text-slate-300">
                          Jarak ke kantor: <span className={`font-extrabold ${distance <= 100 ? "text-emerald-400" : "text-rose-400"}`}>{Math.round(distance)} meter</span>
                          {distance <= 100 ? (
                            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full ml-1.5 font-bold uppercase tracking-wider">Lolos</span>
                          ) : (
                            <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full ml-1.5 font-bold uppercase tracking-wider">Terlalu Jauh</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!gpsLoading && !gpsError && (
                  <div className="text-xs text-slate-500">
                    Sistem akan otomatis melanjutkan ke halaman Kamera Selfie...
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Selfie Photo */}
            {step === 4 && (
              <div className="space-y-6 flex flex-col items-center">
                <div className="text-center w-full">
                  <h2 className="text-2xl font-bold text-slate-100">Ambil Foto Selfie</h2>
                  <p className="text-slate-400 text-sm mt-1">Posisikan wajah Anda di dalam kamera depan.</p>
                </div>

                {cameraError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl w-full">
                    ⚠️ {cameraError}
                  </div>
                )}

                <div className="relative w-full aspect-[4/3] max-w-[320px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  
                  {/* Face overlay guide */}
                  <div className="absolute inset-0 border-[3px] border-emerald-500/30 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-64 border-2 border-dashed border-emerald-400/40 rounded-[100px]/[130px] opacity-70"></div>
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={startSelfieKamera}
                    className="px-4 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Reset Kamera
                  </button>
                  <button
                    onClick={ambilFotoSelfie}
                    disabled={!cameraActive}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-slate-400 text-slate-950 font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    📸 Ambil Foto Selfie
                  </button>
                </div>

                {/* Canvas hidden container */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-100">Review Kehadiran</h2>
                  <p className="text-slate-400 text-sm mt-1">Periksa kembali data absensi Anda sebelum submit.</p>
                </div>

                {/* Review Card */}
                <div className="space-y-4 border border-slate-800 rounded-2xl p-4 bg-slate-950/40">
                  <div className="flex items-center gap-4">
                    {/* Foto preview */}
                    {fotoBase64 && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-800 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={fotoBase64}
                          alt="Selfie Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-100">{karyawanInfo?.nama}</div>
                      <div className="text-xs text-slate-500 font-mono">NIP: {nip}</div>
                      <div className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider mt-0.5">{karyawanInfo?.jabatan}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-900 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Koordinat:</span>
                      <span className="font-mono text-slate-300">{latitude?.toFixed(6)}, {longitude?.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jarak ke kantor:</span>
                      <span className={`font-semibold ${distance !== null && distance <= 100 ? "text-emerald-400" : "text-rose-400"}`}>
                        {distance !== null ? `${Math.round(distance)} meter` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Token QR:</span>
                      <span className="font-mono text-slate-400 max-w-[200px] truncate">{qrToken}</span>
                    </div>
                    {isMockGps && (
                      <div className="flex justify-between text-[10px] text-amber-500 font-semibold">
                        <span>Status GPS:</span>
                        <span>Mocked (Testing)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 rounded-xl font-semibold text-sm transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-slate-950 font-extrabold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Mengirim...
                      </>
                    ) : (
                      "Kirim Absensi"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* RESULT CARD (Success / Fail) */
          <div className="glass-panel p-8 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden transition-all duration-300">
            {result.success ? (
              /* SUCCESS SCREEN */
              <div className="space-y-6">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] animate-scale-up">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-slate-100">Berhasil Absen!</h2>
                  <p className="text-slate-400 text-sm">{result.message}</p>
                </div>

                <div className="p-4 border border-slate-900 bg-slate-950/60 rounded-2xl space-y-2.5 text-xs max-w-xs mx-auto text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Pegawai:</span>
                    <span className="font-bold text-slate-300">{karyawanInfo?.nama}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIP:</span>
                    <span className="font-mono text-slate-300 font-semibold">{nip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Kehadiran:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full border text-[10px] ${
                        result.status === "TERLAMBAT"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Akurasi GPS:</span>
                    <span className="text-emerald-400 font-semibold">{result.jarakKantor}m (Radius 100m)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 max-w-xs mx-auto">
                  <button
                    onClick={handleReset}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Kembali Ke Depan
                  </button>
                  <Link
                    href="/"
                    className="w-full py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 rounded-xl font-semibold text-sm transition-colors block text-center"
                  >
                    Keluar Absen
                  </Link>
                </div>
              </div>
            ) : (
              /* FAILURE SCREEN */
              <div className="space-y-6">
                <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)] animate-shake">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-slate-100">Gagal Absen!</h2>
                  <p className="text-rose-400 font-semibold text-sm leading-relaxed max-w-xs mx-auto">
                    {result.message}
                  </p>
                </div>

                <div className="p-4 border border-slate-900 bg-slate-950/60 rounded-2xl text-xs text-left max-w-xs mx-auto space-y-1.5 leading-relaxed text-slate-400">
                  <p className="font-bold text-slate-300 mb-1">Kemungkinan Penyebab:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Jarak GPS Anda di luar batas 100m kantor.</li>
                    <li>QR Code yang Anda scan sudah kedaluwarsa (5 menit).</li>
                    <li>QR Code tersebut sudah digunakan orang lain.</li>
                    <li>Koneksi internet Anda terputus.</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3 pt-4 max-w-xs mx-auto">
                  <button
                    onClick={handleReset}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Coba Ulang Absensi
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setStep(3); // Kembali ke step GPS agar bisa pakai mock
                    }}
                    className="w-full py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 rounded-xl font-semibold text-sm transition-colors"
                  >
                    Gunakan Mock GPS (Ulang Step GPS)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
