"use client";

import { useEffect, useState } from "react";

interface Karyawan {
  id: number;
  nip: string;
  nama: string;
  jabatan: string;
  createdAt: string;
}

export default function KaryawanManagement() {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [loading, setLoading] = useState(true);
  const [nip, setNip] = useState("");
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch employees
  async function fetchKaryawan() {
    try {
      const res = await fetch("/api/admin/karyawan");
      if (res.ok) {
        const data = await res.json();
        setKaryawanList(data);
      } else {
        console.error("Failed to fetch karyawan");
      }
    } catch (error) {
      console.error("Error fetching karyawan:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKaryawan();
  }, []);

  // Handle create employee
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!nip.trim() || !nama.trim() || !jabatan.trim()) {
      setErrorMsg("Semua field formulir wajib diisi!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/karyawan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nip, nama, jabatan }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`Karyawan "${data.nama}" berhasil ditambahkan!`);
        setNip("");
        setNama("");
        setJabatan("");
        fetchKaryawan(); // Refresh list
      } else {
        setErrorMsg(data.error || "Gagal menambahkan karyawan");
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan server saat mengirim data.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  // Handle delete employee
  async function handleDelete(id: number, name: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus karyawan "${name}"? Semua data absensi terkait karyawan ini juga akan dihapus secara permanen.`)) {
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/admin/karyawan?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`Karyawan "${name}" berhasil dihapus.`);
        fetchKaryawan(); // Refresh list
      } else {
        setErrorMsg(data.error || "Gagal menghapus karyawan");
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan server saat menghapus.");
      console.error(error);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">
          Manajemen Data Karyawan
        </h2>
        <p className="text-slate-400 mt-1">
          Daftarkan karyawan baru dan kelola database kepegawaian kantor.
        </p>
      </div>

      {/* Grid: Form & Table */}
      <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Form Panel */}
        <div className="glass-panel p-6 rounded-2xl md:col-span-1 shadow-lg relative">
          <h3 className="text-lg font-bold text-slate-200 mb-4">Tambah Karyawan</h3>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl mb-4 animate-shake">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl mb-4">
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nip" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                NIP (Nomor Induk Pegawai)
              </label>
              <input
                id="nip"
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Contoh: 10245089"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="nama" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Nama Lengkap
              </label>
              <input
                id="nama"
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="jabatan" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Jabatan / Posisi
              </label>
              <input
                id="jabatan"
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Software Engineer"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_4px_15px_-3px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                "Simpan Karyawan"
              )}
            </button>
          </form>
        </div>

        {/* Table Panel */}
        <div className="glass-panel rounded-2xl md:col-span-2 shadow-lg overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-200">Daftar Karyawan</h3>
            <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-full font-semibold">
              {karyawanList.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Memuat data karyawan...</span>
              </div>
            ) : karyawanList.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-slate-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <p className="text-sm">Belum ada karyawan terdaftar.</p>
                <p className="text-xs text-slate-600 mt-1">Daftarkan karyawan baru melalui form di samping.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-900">
                  <tr>
                    <th className="px-6 py-4">NIP</th>
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">Jabatan</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {karyawanList.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-900/40 transition-colors group">
                      <td className="px-6 py-4 font-mono text-slate-300 font-semibold">{k.nip}</td>
                      <td className="px-6 py-4 font-semibold text-slate-100">{k.nama}</td>
                      <td className="px-6 py-4 text-slate-400">{k.jabatan}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(k.id, k.nama)}
                          className="p-1.5 bg-rose-500/10 border border-transparent hover:border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                          title="Hapus Karyawan"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
