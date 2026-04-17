"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3 } from "lucide-react";
import { clsx } from "clsx";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dash", href: "/dashboard", icon: LayoutDashboard },
    { name: "Kasir", href: "/", icon: ShoppingCart },
    { name: "Stok", href: "/inventory", icon: Package },
    { name: "Laporan", href: "/reports", icon: BarChart3 },
    { name: "Admin", href: "/cashiers", icon: Users },
  ];

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-black flex items-center gap-2 text-primary">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <span className="tracking-tighter uppercase">Pempek Kasir</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest",
                    isActive 
                      ? "bg-orange-50 text-primary shadow-sm" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  )}
                >
                  <item.icon className="w-4 h-4" /> {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center h-20 px-2 z-[90] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[32px]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={clsx(
                "flex flex-col items-center gap-1.5 transition-all flex-1 py-2",
                isActive ? "text-primary" : "text-gray-400"
              )}
            >
              <div className={clsx(
                "p-2.5 rounded-2xl transition-all duration-300",
                isActive ? "bg-orange-50 scale-110 shadow-sm" : "active:scale-90"
              )}>
                <item.icon className={clsx("w-5 h-5", isActive ? "stroke-[3px]" : "stroke-[2px]")} />
              </div>
              <span className={clsx(
                "text-[10px] font-black uppercase tracking-tighter transition-all",
                isActive ? "opacity-100 translate-y-0" : "opacity-60"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </footer>
      <div className="md:hidden h-20"></div>
    </>
  );
}
