"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, CheckCircle2, Database, AlertCircle } from "lucide-react";

interface Cashier {
  id: string;
  name: string;
}

import { LocalData } from "@/lib/local-data";

export default function CashiersPage() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    // Gunakan LocalData sebagai sumber utama (Tanpa Database)
    const localCashiers = LocalData.getCashiers();
    setCashiers(localCashiers);

    // Coba sync ke API di background jika ada (Optional)
    try {
      const res = await fetch("/api/cashiers");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Jika API berhasil dan ada data, sinkronkan ke local
        // Tapi untuk sekarang kita prioritaskan LocalData agar user tidak melihat error
      }
    } catch (error) {
      console.log("Database tidak terdeteksi, menggunakan mode Offline.");
    }
  };

  const handleSyncDatabase = async () => {
    setSetupLoading(true);
    try {
      const res = await fetch("/api/setup");
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        fetchCashiers();
      } else {
        // Tampilkan error yang lebih spesifik jika ada
        const errorText = data.error || "Gagal menyinkronkan database.";
        const detailText = data.detail ? ` (${data.detail})` : "";
        setMessage({ type: "error", text: errorText + detailText });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Terjadi kesalahan saat menyinkronkan database." });
    } finally {
      setSetupLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      // 1. Simpan ke LocalData (Langsung Berhasil)
      LocalData.saveCashier(name);
      
      // 2. Coba simpan ke API (Background)
      fetch("/api/cashiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).catch(() => {});

      setName("");
      fetchCashiers();
      setMessage({ type: "success", text: "Kasir berhasil ditambahkan!" });
    } catch (error) {
      console.error("Error adding cashier:", error);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Toast Message */}
      {message && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-[100] transition-all flex items-center gap-3 font-bold ${
          message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">DATA KASIR</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Manajemen Pengguna</p>
          </div>
        </div>

        <button 
          onClick={handleSyncDatabase}
          disabled={setupLoading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {setupLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : <Database className="w-4 h-4 text-orange-400" />}
          Setup Database
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form Tambah Kasir */}
        <div className="md:col-span-1">
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Tambah Kasir
            </h2>
            <form onSubmit={handleAddCashier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kasir</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Contoh: Budi"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <button
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? "Menambah..." : "Tambah Kasir"}
              </button>
            </form>
          </div>
        </div>

        {/* Daftar Kasir */}
        <div className="md:col-span-2">
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Daftar Kasir Terdaftar</h2>
            <div className="space-y-3">
              {cashiers.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 text-primary rounded-full flex items-center justify-center font-bold">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{c.name}</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              ))}
              {cashiers.length === 0 && (
                <div className="py-10 text-center text-gray-400">
                  Belum ada kasir yang terdaftar
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
