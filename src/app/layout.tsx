import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kasir Pempek",
  description: "Aplikasi Kasir Pempek Lengkap",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-lg font-black flex items-center gap-2 text-primary">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
              <span className="tracking-tighter uppercase">Pempek Kasir</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard" className="px-4 py-2 rounded-xl hover:bg-orange-50 hover:text-primary transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <LayoutDashboard className="w-4 h-4" /> Dash
              </Link>
              <Link href="/" className="px-4 py-2 rounded-xl hover:bg-orange-50 hover:text-primary transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <ShoppingCart className="w-4 h-4" /> Kasir
              </Link>
              <Link href="/inventory" className="px-4 py-2 rounded-xl hover:bg-orange-50 hover:text-primary transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <Package className="w-4 h-4" /> Stok
              </Link>
              <Link href="/reports" className="px-4 py-2 rounded-xl hover:bg-orange-50 hover:text-primary transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <BarChart3 className="w-4 h-4" /> Laporan
              </Link>
              <Link href="/cashiers" className="px-4 py-2 rounded-xl hover:bg-orange-50 hover:text-primary transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <Users className="w-4 h-4" /> Admin
              </Link>
            </nav>
          </div>
        </header>
        
        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>

        <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center h-20 px-2 z-[90] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[32px]">
          <Link href="/dashboard" className="flex flex-col items-center gap-1.5 text-gray-400 group">
            <div className="p-2.5 rounded-2xl group-active:scale-90 transition-all">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">Dash</span>
          </Link>
          <Link href="/" className="flex flex-col items-center gap-1.5 text-primary group">
            <div className="bg-orange-50 p-2.5 rounded-2xl group-active:scale-90 transition-all">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">Kasir</span>
          </Link>
          <Link href="/inventory" className="flex flex-col items-center gap-1.5 text-gray-400 group">
            <div className="p-2.5 rounded-2xl group-active:scale-90 transition-all">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">Stok</span>
          </Link>
          <Link href="/reports" className="flex flex-col items-center gap-1.5 text-gray-400 group">
            <div className="p-2.5 rounded-2xl group-active:scale-90 transition-all">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">Laporan</span>
          </Link>
          <Link href="/cashiers" className="flex flex-col items-center gap-1.5 text-gray-400 group">
            <div className="p-2.5 rounded-2xl group-active:scale-90 transition-all">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">Admin</span>
          </Link>
        </footer>
        <div className="md:hidden h-20"></div> {/* Spacer for mobile footer */}
      </body>
    </html>
  );
}
