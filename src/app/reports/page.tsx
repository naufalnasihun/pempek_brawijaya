"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, Calendar, Filter, Receipt, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
}

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<"daily" | "monthly">("daily");
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
  const [monthFilter, setMonthFilter] = useState(format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [dateFilter, monthFilter, filterType]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const param = filterType === "daily" ? `date=${dateFilter}` : `month=${monthFilter}`;
      const res = await fetch(`/api/transactions?${param}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
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

      <div className="card">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Daftar Transaksi
        </h2>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left min-w-[650px]">
            <thead>
              <tr className="border-b text-gray-500 text-sm">
                <th className="pb-2 font-medium">Waktu</th>
                <th className="pb-2 font-medium">Kasir</th>
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium text-right">Metode</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((t) => (
                <tr key={t.id} className="text-sm">
                  <td className="py-4 text-gray-500">
                    {format(new Date(t.createdAt), "HH:mm", { locale: id })}
                    <div className="text-[10px]">{format(new Date(t.createdAt), "dd MMM yyyy")}</div>
                  </td>
                  <td className="py-4 font-medium">{t.cashierName}</td>
                  <td className="py-4">
                    <div className="flex flex-col gap-1">
                      {t.items.map((item, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded-md w-fit">
                          {item.productName} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.paymentMethod === "TUNAI" 
                        ? "bg-green-100 text-green-700" 
                        : t.paymentMethod === "GRAB"
                        ? "bg-emerald-600 text-white"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {t.paymentMethod}
                    </span>
                  </td>
                  <td className="py-4 text-right font-bold text-gray-900">
                    Rp {t.total.toLocaleString()}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
