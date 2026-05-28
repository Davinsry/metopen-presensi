import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#05070c] py-16">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none animate-pulse-slow" style={{ animationDelay: "2s" }}></div>

      <div className="max-w-4xl w-full text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300 font-semibold mb-6 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          Sistem Absensi Multi-Verifikasi
        </div>
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent mb-6">
          PresensiKu
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-14">
          Sistem absensi karyawan berbasis web dengan verifikasi berlapis: **QR Code Dinamis**, **Validasi GPS Radius**, dan **Foto Selfie Kamera Native**.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Card Admin */}
          <Link
            href="/admin"
            className="group relative flex flex-col items-start p-8 rounded-2xl glass-panel glow-indigo hover:border-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1.5"
          >
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-3 group-hover:text-indigo-300 transition-colors">
              Halaman Admin
            </h2>
            <p className="text-slate-400 text-left text-sm leading-relaxed mb-8">
              Kelola data karyawan, pantau laporan kehadiran absensi secara real-time, generate QR Code dinamis kantor, dan filter data per tanggal.
            </p>
            <span className="flex items-center text-sm font-semibold text-indigo-400 group-hover:text-indigo-300 mt-auto">
              Masuk Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2 transform group-hover:translate-x-1.5 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Link>

          {/* Card Karyawan */}
          <Link
            href="/absen"
            className="group relative flex flex-col items-start p-8 rounded-2xl glass-panel glow-emerald hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1.5"
          >
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-3 group-hover:text-emerald-300 transition-colors">
              Halaman Karyawan
            </h2>
            <p className="text-slate-400 text-left text-sm leading-relaxed mb-8">
              Lakukan absensi mandiri dengan menginput NIP, men-scan QR Code dinamis kantor, validasi GPS lokasi, dan mengambil foto selfie sebagai bukti kehadiran.
            </p>
            <span className="flex items-center text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 mt-auto">
              Mulai Absensi
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2 transform group-hover:translate-x-1.5 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
