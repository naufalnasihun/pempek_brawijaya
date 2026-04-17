"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, TrendingUp, Users, Package, AlertTriangle, ArrowRight, ShoppingBag, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Summary {
  todayRevenue: number;
  todayTransactions: number;
  lowStockIngredients: { name: string; stock: number }[];
  recentTransactions: any[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary>({
    todayRevenue: 0,
    todayTransactions: 0,
    lowStockIngredients: [],
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const [transRes, ingRes] = await Promise.all([
        fetch(`/api/transactions?date=${today}`),
        fetch("/api/ingredients"),
      ]);

      const transactions = await transRes.json();
      const ingredients = await ingRes.json();

      setSummary({
        todayRevenue: Array.isArray(transactions) ? transactions.reduce((sum: number, t: any) => sum + t.total, 0) : 0,
        todayTransactions: Array.isArray(transactions) ? transactions.length : 0,
        lowStockIngredients: Array.isArray(ingredients) ? ingredients.filter((i: any) => i.stock < 10) : [],
        recentTransactions: Array.isArray(transactions) ? transactions.slice(0, 5) : [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">DASHBOARD</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
          </p>
        </div>
        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
          <LayoutDashboard className="w-6 h-6" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-primary text-white border-none shadow-lg shadow-primary/20">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-2 rounded-xl text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Omzet Hari Ini</span>
          </div>
          <div className="text-3xl font-black">Rp {summary.todayRevenue.toLocaleString()}</div>
        </div>
        <div className="card bg-white border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-orange-50 p-2 rounded-xl text-primary">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaksi</span>
          </div>
          <div className="text-3xl font-black text-gray-900">{summary.todayTransactions}</div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {summary.lowStockIngredients.length > 0 && (
        <div className="card bg-red-50 border-red-100 border-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-xl text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black text-red-700 uppercase tracking-widest">Peringatan Stok Menipis!</h2>
          </div>
          <div className="space-y-3">
            {summary.lowStockIngredients.map((ing) => (
              <div key={ing.name} className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100">
                <span className="text-sm font-bold text-gray-700">{ing.name}</span>
                <span className="bg-red-100 text-red-600 text-xs font-black px-2.5 py-1 rounded-lg">
                  Sisa {ing.stock}
                </span>
              </div>
            ))}
          </div>
          <Link href="/inventory" className="mt-4 flex items-center justify-center gap-2 text-xs font-black text-red-600 uppercase tracking-widest py-2 hover:bg-red-100/50 rounded-xl transition-all">
            Update Stok <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Recent Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Transaksi Terakhir</h2>
          <Link href="/reports" className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="space-y-3">
          {summary.recentTransactions.length === 0 ? (
            <div className="card text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest">
              Belum ada transaksi hari ini
            </div>
          ) : (
            summary.recentTransactions.map((t) => (
              <div key={t.id} className="card p-4 flex items-center justify-between hover:border-primary/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{t.cashierName}</div>
                    <div className="text-[10px] text-gray-400 font-medium">{format(new Date(t.createdAt), "HH:mm")} • {t.paymentMethod}</div>
                  </div>
                </div>
                <div className="text-sm font-black text-gray-900">
                  Rp {t.total.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Menu (Mobile Dashboard) */}
      <div className="space-y-4">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest px-1">Menu Cepat</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/" className="card p-6 flex flex-col items-center gap-3 text-center hover:border-primary transition-all">
            <div className="bg-orange-50 p-3 rounded-2xl text-primary">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Buka Kasir</span>
          </Link>
          <Link href="/inventory" className="card p-6 flex flex-col items-center gap-3 text-center hover:border-primary transition-all">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Cek Stok</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
