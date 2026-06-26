"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, Calendar, Filter, Receipt, TrendingUp, Trash2, Edit2, X, Check, Plus, Minus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PRODUCTS } from "@/constants/products";

interface Transaction {
  id: string;
  cashierName: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
  shift: string;
}

import { LocalData } from "@/lib/local-data";

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<"daily" | "monthly">("daily");
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
  const [monthFilter, setMonthFilter] = useState(format(new Date(), "yyyy-MM"));
  const [shiftFilter, setShiftFilter] = useState<string>("Semua Shift");
  const [loading, setLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editItems, setEditItems] = useState<{productName: string; quantity: number; price: number}[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, [dateFilter, monthFilter, filterType, shiftFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // 1. Ambil data dari LocalData (Offline-First)
      const allLocal = LocalData.getTransactions();
      
      // Filter data sesuai filter yang dipilih
      const filtered = allLocal.filter(t => {
        const date = new Date(t.createdAt);
        
        // Filter Waktu
        const matchesTime = filterType === "daily" 
          ? format(date, "yyyy-MM-dd") === dateFilter
          : format(date, "yyyy-MM") === monthFilter;
          
        // Filter Shift
        const matchesShift = shiftFilter === "Semua Shift" || t.shift === shiftFilter;

        return matchesTime && matchesShift;
      });

      setTransactions(filtered);

      // 2. Sync dari API jika ada (Background)
      const param = filterType === "daily" ? `date=${dateFilter}` : `month=${monthFilter}`;
      fetch(`/api/transactions?${param}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            // Optional sync
          }
        })
        .catch(() => {});

    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const dataToExport = transactions.map((t) => ({
      ID: t.id,
      Waktu: format(new Date(t.createdAt), "dd/MM/yyyy HH:mm"),
      Kasir: t.cashierName,
      Total: t.total,
      Metode: t.paymentMethod,
      Item: t.items.map((i) => `${i.productName} (${i.quantity})`).join(", "),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    const fileName = `Laporan_${filterType}_${filterType === "daily" ? dateFilter : monthFilter}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini? Stok akan dikembalikan.")) {
      LocalData.deleteTransaction(transactionId);
      fetchTransactions();
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction({...transaction});
    setEditItems([...transaction.items]);
  };

  const handleSaveEdit = () => {
    if (!editingTransaction) return;
    
    // Hitung total baru
    const newTotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const updatedTransaction: Transaction = {
      ...editingTransaction,
      items: editItems,
      total: newTotal
    };
    
    LocalData.updateTransaction(updatedTransaction);
    setEditingTransaction(null);
    fetchTransactions();
  };

  const updateEditItemQuantity = (index: number, delta: number) => {
    const newItems = [...editItems];
    newItems[index] = {
      ...newItems[index],
      quantity: Math.max(1, newItems[index].quantity + delta)
    };
    setEditItems(newItems);
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = transactions.length;

  // Prepare chart data
  const chartData = (() => {
    if (filterType === "monthly") {
      const [year, month] = monthFilter.split("-").map(Number);
      const start = startOfMonth(new Date(year, month - 1));
      const end = endOfMonth(new Date(year, month - 1));
      const days = eachDayOfInterval({ start, end });

      return days.map(day => {
        const dailyTotal = transactions
          .filter(t => isSameDay(new Date(t.createdAt), day))
          .reduce((sum, t) => sum + t.total, 0);
        return {
          name: format(day, "d"),
          omzet: dailyTotal
        };
      });
    } else {
      // Daily: group by hours (8am to 10pm)
      const hours = Array.from({ length: 15 }, (_, i) => i + 8);
      return hours.map(hour => {
        const hourlyTotal = transactions
          .filter(t => new Date(t.createdAt).getHours() === hour)
          .reduce((sum, t) => sum + t.total, 0);
        return {
          name: `${hour}:00`,
          omzet: hourlyTotal
        };
      });
    }
  })();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">LAPORAN</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Analisis Penjualan</p>
          </div>
        </div>
        <button
          onClick={exportToExcel}
          disabled={transactions.length === 0}
          className="btn-primary flex items-center justify-center gap-2 py-3 shadow-lg shadow-primary/20"
        >
          <Download className="w-4 h-4" />
          Eksport Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-primary text-white border-none shadow-lg shadow-primary/10">
          <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">Total Omzet</span>
          <span className="text-3xl font-black">Rp {totalRevenue.toLocaleString()}</span>
        </div>
        <div className="card bg-white border-gray-100">
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Transaksi</span>
          <span className="text-3xl font-black text-gray-900">{totalTransactions}</span>
        </div>
        <div className="card lg:col-span-2 flex items-center gap-4 bg-orange-50/50 border-orange-100">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white p-2.5 rounded-xl shadow-sm">
              <Filter className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <select
                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="daily">Harian</option>
                <option value="monthly">Bulanan</option>
              </select>
              {filterType === "daily" ? (
                <input
                  type="date"
                  className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 flex-1"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              ) : (
                <input
                  type="month"
                  className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 flex-1"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                />
              )}
              <select
                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
              >
                <option value="Semua Shift">Semua Shift</option>
                <option value="Shift 1">Shift 1</option>
                <option value="Shift 2">Shift 2</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-gray-100">
        <h2 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
          <TrendingUp className="w-5 h-5 text-primary" />
          Grafik Omzet {filterType === "daily" ? "Per Jam" : "Harian"}
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 700}} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} tick={{fill: '#94a3b8', fontWeight: 700}} />
              <Tooltip 
                cursor={{fill: '#fef3e7', radius: 8}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                itemStyle={{ color: '#ea580c', fontWeight: 900, fontSize: '12px' }}
                labelStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}
                formatter={(val: number) => [`Rp ${val.toLocaleString()}`, "Omzet"]}
              />
              <Bar dataKey="omzet" fill="#ea580c" radius={[6, 6, 0, 0]} barSize={filterType === 'daily' ? 20 : undefined} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
            <Receipt className="w-5 h-5 text-primary" />
            Riwayat Transaksi
          </h2>
          <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-100">
            Total {transactions.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                <th className="px-6 py-4 font-black">Waktu & ID</th>
                <th className="px-6 py-4 font-black">Kasir</th>
                <th className="px-6 py-4 font-black">Detail Pesanan</th>
                <th className="px-6 py-4 font-black text-right">Pembayaran</th>
                <th className="px-6 py-4 font-black text-right">Total</th>
                <th className="px-6 py-4 font-black text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <tr key={t.id} className="text-sm hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{format(new Date(t.createdAt), "HH:mm", { locale: id })}</div>
                    <div className="text-[10px] text-gray-400 font-medium">{format(new Date(t.createdAt), "dd MMM yyyy")}</div>
                    <div className="text-[9px] text-gray-300 font-mono mt-1 group-hover:text-primary/50 transition-colors">#{t.id.slice(-6).toUpperCase()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-50 text-primary rounded-full flex items-center justify-center text-[10px] font-black border border-orange-100">
                        {t.cashierName.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-700">{t.cashierName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                      {t.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-white border border-gray-100 px-2 py-1 rounded-lg shadow-sm">
                          <span className="text-[10px] font-black text-primary">{item.quantity}x</span>
                          <span className="text-[10px] font-bold text-gray-600">{item.productName}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
                      t.paymentMethod === "TUNAI" 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : t.paymentMethod === "GRAB"
                        ? "bg-green-600 text-white"
                        : "bg-blue-50 text-blue-600 border border-blue-100"
                    }`}>
                      {t.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-black text-gray-900">Rp {t.total.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditTransaction(t)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Edit Transaksi</h3>
              <button
                onClick={() => setEditingTransaction(null)}
                className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Detail Pesanan</label>
                <div className="space-y-3">
                  {editItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-bold text-gray-900">{item.productName}</div>
                        <div className="text-xs text-gray-500">Rp {item.price.toLocaleString()} / item</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200">
                          <button
                            onClick={() => updateEditItemQuantity(index, -1)}
                            className="p-1.5 text-gray-500 hover:text-gray-700"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateEditItemQuantity(index, 1)}
                            className="p-1.5 text-gray-500 hover:text-gray-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="font-bold text-primary w-24 text-right">
                          Rp {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-bold">Total</span>
                  <span className="text-2xl font-black text-primary">
                    Rp {editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 btn-primary"
                >
                  <Check className="w-4 h-4 inline mr-2" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
