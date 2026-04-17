"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, History, Package } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Ingredient {
  name: string;
  stock: number;
}

interface StockHistory {
  id: string;
  ingredientName: string;
  change: number;
  type: string;
  createdAt: string;
}

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockForm, setStockForm] = useState({ name: "", amount: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ingRes, histRes] = await Promise.all([
        fetch("/api/ingredients"),
        fetch("/api/stock-history"),
      ]);
      const ingData = await ingRes.json();
      const histData = await histRes.json();
      setIngredients(Array.isArray(ingData) ? ingData : []);
      setHistory(Array.isArray(histData) ? histData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.name || !stockForm.amount) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stockForm.name,
          stockChange: parseInt(stockForm.amount),
        }),
      });

      if (res.ok) {
        setStockForm({ name: "", amount: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Error updating stock:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">STOK BAHAN</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Manajemen Inventori</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ingredients.map((ing) => (
          <div key={ing.name} className="card border-l-4 border-l-primary flex flex-col gap-1 hover:shadow-md transition-shadow">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{ing.name}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-900">{ing.stock}</span>
              <span className="text-sm font-semibold text-gray-500">biji</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah Stok */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Tambah Stok
            </h2>
            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bahan Baku</label>
                <select
                  className="input"
                  required
                  value={stockForm.name}
                  onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })}
                >
                  <option value="">Pilih Bahan</option>
                  {ingredients.map((ing) => (
                    <option key={ing.name} value={ing.name}>
                      {ing.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Biji)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Contoh: 50"
                  required
                  value={stockForm.amount}
                  onChange={(e) => setStockForm({ ...stockForm, amount: e.target.value })}
                />
              </div>
              <button
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? "Menyimpan..." : "Simpan Stok"}
              </button>
            </form>
          </div>
        </div>

        {/* Riwayat Stok */}
        <div className="lg:col-span-2">
          <div className="card h-full flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Riwayat Stok Terbaru
            </h2>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="border-b text-gray-500 text-sm">
                    <th className="pb-2 font-medium">Waktu</th>
                    <th className="pb-2 font-medium">Bahan</th>
                    <th className="pb-2 font-medium text-right">Perubahan</th>
                    <th className="pb-2 font-medium text-right">Tipe</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((h) => (
                    <tr key={h.id} className="text-sm">
                      <td className="py-3 text-gray-500">
                        {format(new Date(h.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                      </td>
                      <td className="py-3 font-medium">{h.ingredientName}</td>
                      <td className={`py-3 text-right font-bold ${h.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {h.change >= 0 ? "+" : ""}{h.change}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          h.type === "ADD" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {h.type === "ADD" ? "TAMBAH" : "PENGURANGAN"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-400">
                        Belum ada riwayat stok
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
