"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, CheckCircle2 } from "lucide-react";

interface Cashier {
  id: string;
  name: string;
}

export default function CashiersPage() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    try {
      const res = await fetch("/api/cashiers");
      const data = await res.json();
      setCashiers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching cashiers:", error);
    }
  };

  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      const res = await fetch("/api/cashiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setName("");
        fetchCashiers();
      }
    } catch (error) {
      console.error("Error adding cashier:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">DATA KASIR</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Manajemen Pengguna</p>
        </div>
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
