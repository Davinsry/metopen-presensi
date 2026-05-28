"use client";

import { useEffect, useState } from "react";

interface Absensi {
  id: number;
  karyawanId: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  foto: string; // base64 string
  qrToken: string;
  status: string;
  karyawan: {
    nip: string;
    nama: string;
    jabatan: string;
  };
}

export default function LaporanAbsensi() {
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState("");
  const [zoomedFoto, setZoomedFoto] = useState<string | null>(null);
  const [activeKaryawan, setActiveKaryawan] = useState<{ nama: string; nip: string } | null>(null);

  // Fetch reports from API
  async function fetchLaporan() {
    setLoading(true);
    try {
      let url = "/api/admin/laporan";
      if (tanggal) {
        url += `?tanggal=${tanggal}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAbsensiList(data);
      } else {
        console.error("Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLaporan();
  }, [tanggal]);

  const handleResetFilter = () => {
    setTanggal("");
  };

  // Format date helper
  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const datePart = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} - ${timePart} WIB`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">
            Laporan Kehadiran Karyawan
          </h2>
          <p className="text-slate-400 mt-1">
            Riwayat log presensi lengkap beserta koordinat GPS dan verifikasi foto selfie.
          </p>
        </div>

        {/* Filter Tanggal */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold select-none cursor-pointer"
            />
          </div>
          {tanggal && (
            <button
              onClick={handleResetFilter}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Reports Table Panel */}
      <div className="glass-panel rounded-2xl shadow-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-200">Riwayat Presensi</h3>
          <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-full font-semibold">
            {absensiList.length} log ditemukan
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Memuat data absensi...</span>
            </div>
          ) : absensiList.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-slate-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M12 3v2.25m5.25-2.25V5.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Z" />
              </svg>
              <p className="text-sm">Tidak ada riwayat absensi ditemukan.</p>
              <p className="text-xs text-slate-600 mt-1">
                {tanggal ? `Pada tanggal ${tanggal}` : "Belum ada data absensi di database."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-900">
                <tr>
                  <th className="px-6 py-4">Karyawan</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Lokasi GPS</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Selfie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {absensiList.map((absen) => {
                  const isLate = absen.status === "TERLAMBAT";
                  return (
                    <tr key={absen.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* Karyawan (Name, NIP, Position) */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-100">{absen.karyawan.nama}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">NIP: {absen.karyawan.nip}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5 tracking-wider">{absen.karyawan.jabatan}</div>
                        </div>
                      </td>

                      {/* Waktu Absen */}
                      <td className="px-6 py-4 font-medium text-slate-300">
                        {formatDateTime(absen.timestamp)}
                      </td>

                      {/* Lokasi GPS (Coords + Maps link) */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs text-slate-400">
                            {absen.latitude.toFixed(6)}, {absen.longitude.toFixed(6)}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${absen.latitude},${absen.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors w-max gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>
                            Lihat Peta
                          </a>
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isLate
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isLate ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                          {absen.status}
                        </span>
                      </td>

                      {/* Selfie Thumbnail */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setZoomedFoto(absen.foto);
                            setActiveKaryawan({ nama: absen.karyawan.nama, nip: absen.karyawan.nip });
                          }}
                          className="relative group/thumb focus:outline-none"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800 shadow-md group-hover/thumb:border-indigo-500/50 transition-all duration-300 transform group-hover/thumb:scale-110">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={absen.foto}
                              alt="Selfie Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Selfie Zoom Modal */}
      {zoomedFoto && activeKaryawan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => {
            setZoomedFoto(null);
            setActiveKaryawan(null);
          }}
        >
          {/* Modal Container */}
          <div
            className="glass-panel p-6 rounded-2xl max-w-md w-full shadow-2xl relative border border-slate-800/80 overflow-hidden transform scale-95 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-100">{activeKaryawan.nama}</h4>
                <p className="text-xs text-slate-500 font-mono">NIP: {activeKaryawan.nip}</p>
              </div>
              <button
                onClick={() => {
                  setZoomedFoto(null);
                  setActiveKaryawan(null);
                }}
                className="p-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Selfie Zoom Image */}
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomedFoto}
                alt="Selfie Zoomed"
                className="w-full h-full object-cover"
              />
            </div>
            
            <p className="text-center text-[10px] text-slate-500 mt-4 tracking-wider uppercase font-bold">
              Kamera Selfie Terverifikasi
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
