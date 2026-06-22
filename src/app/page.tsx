"use client";

import { useState, useEffect } from "react";
import { PRODUCTS, Product, IngredientName } from "@/constants/products";
import { LocalData } from "@/lib/local-data";
import { ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, X, ChevronUp } from "lucide-react";
import { clsx } from "clsx";

interface CartItem extends Product {
  quantity: number;
}

interface Ingredient {
  name: string;
  stock: number;
}

interface Cashier {
  id: string;
  name: string;
}

export default function CashierPage() {
  const [activeCashier, setActiveCashier] = useState<string>("");
  const [activeShift, setActiveShift] = useState<string>("Shift 1");
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"TUNAI" | "QRIS" | "GRAB">("TUNAI");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [uangDiterima, setUangDiterima] = useState<string>("");

  useEffect(() => {
    fetchData();
    const savedCashier = localStorage.getItem("activeCashier");
    if (savedCashier) setActiveCashier(savedCashier);
    setActiveShift(LocalData.getCurrentShift());
  }, []);

  const fetchData = async () => {
    // Gunakan LocalData (Offline-First)
    setIngredients(LocalData.getIngredients());
    setCashiers(LocalData.getCashiers());

    // Sync dari API jika ada
    try {
      const [ingRes, cashRes] = await Promise.all([
        fetch("/api/ingredients"),
        fetch("/api/cashiers"),
      ]);
      const ingData = await ingRes.json();
      const cashData = await cashRes.json();
      if (Array.isArray(ingData) && ingData.length > 0) {
        // Sync local
      }
    } catch (error) {
      console.log("Database tidak terdeteksi, menggunakan mode Offline.");
    }
  };

  const checkStockAvailability = (product: Product, currentCart: CartItem[]) => {
    // Ambil stok terbaru dari LocalData sebelum cek
    const currentIngredients = LocalData.getIngredients();
    
    // Total consumption including what's already in cart
    const totalConsumption: Record<string, number> = {};
    
    // Add current cart items
    currentCart.forEach(item => {
      item.ingredients.forEach(ing => {
        totalConsumption[ing.name] = (totalConsumption[ing.name] || 0) + ing.quantity * item.quantity;
      });
    });

    // Add new product
    let available = true;
    product.ingredients.forEach(ing => {
      const needed = (totalConsumption[ing.name] || 0) + ing.quantity;
      const stock = currentIngredients.find(i => i.name === ing.name)?.stock || 0;
      if (needed > stock) available = false;
    });

    return available;
  };

  const addToCart = (product: Product) => {
    if (!checkStockAvailability(product, cart)) {
      setMessage({ type: "error", text: `Stok tidak cukup untuk ${product.name}!` });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const product = prev.find(p => p.id === productId);
      if (product && delta > 0) {
        // Check stock before increasing
        if (!checkStockAvailability(product, prev)) {
          setMessage({ type: "error", text: `Stok tidak cukup!` });
          setTimeout(() => setMessage(null), 3000);
          return prev;
        }
      }

      return prev.map((item) => {
        if (item.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const uangDiterimaNum = parseInt(uangDiterima.replace(/\D/g, "")) || 0;
  const kembalian = uangDiterimaNum - total;

  const handleCheckout = async () => {
    if (paymentMethod === "TUNAI") {
      if (!uangDiterima) {
        setMessage({ type: "error", text: "Masukkan nominal uang yang diterima!" });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      if (uangDiterimaNum < total) {
        setMessage({ type: "error", text: "Uang yang diterima kurang!" });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
    }
    if (cart.length === 0 || !activeCashier) return;

    setLoading(true);
    try {
      const transactionData = {
        cashierName: activeCashier,
        total,
        paymentMethod,
        items: cart.map(item => ({
          productName: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      // 1. Simpan ke LocalData (Langsung Berhasil)
      LocalData.saveTransaction(transactionData);
      
      // 2. Potong stok di LocalData
      cart.forEach(item => {
        item.ingredients.forEach(ing => {
          LocalData.updateStock(ing.name, -(ing.quantity * item.quantity));
        });
      });

      // 3. Coba simpan ke API (Background)
      fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      }).catch(() => {});

      setCart([]);
      setUangDiterima("");
      setMessage({ type: "success", text: "Transaksi Berhasil!" });
      fetchData(); // Refresh stock display
    } catch (error) {
      console.error("Error checkout:", error);
      setMessage({ type: "error", text: "Terjadi kesalahan saat checkout." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredProducts = PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6 pb-24 lg:pb-0">
        {/* Left Side: Product Selection */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex-1 max-w-sm">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Kasir Aktif</label>
              <select
                className="input h-12"
                value={activeCashier}
                onChange={(e) => {
                  setActiveCashier(e.target.value);
                  localStorage.setItem("activeCashier", e.target.value);
                }}
              >
                <option value="">Pilih Kasir</option>
                {cashiers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-40">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Shift</label>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => {
                    LocalData.setCurrentShift("Shift 1");
                    setActiveShift("Shift 1");
                  }}
                  className={clsx(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                    activeShift === "Shift 1" ? "bg-white text-primary shadow-sm" : "text-gray-400"
                  )}
                >
                  S1
                </button>
                <button
                  onClick={() => {
                    LocalData.setCurrentShift("Shift 2");
                    setActiveShift("Shift 2");
                  }}
                  className={clsx(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                    activeShift === "Shift 2" ? "bg-white text-primary shadow-sm" : "text-gray-400"
                  )}
                >
                  S2
                </button>
              </div>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari menu pempek..."
                className="input h-12 pl-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const isAvailable = checkStockAvailability(product, cart);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={!isAvailable}
                  className={clsx(
                    "card relative flex flex-col justify-between items-start text-left gap-3 hover:border-primary group transition-all duration-300 p-4 min-h-[140px] sm:min-h-[160px]",
                    !isAvailable && "opacity-50 grayscale cursor-not-allowed border-gray-100 shadow-none bg-gray-50"
                  )}
                >
                  <div className="space-y-1 w-full">
                    <div className="text-sm sm:text-base font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors pr-4">
                      {product.name}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 font-medium line-clamp-2">
                      {product.ingredients.map(i => `${i.quantity} ${i.name}`).join(", ")}
                    </div>
                  </div>
                  
                  <div className="w-full flex justify-between items-center mt-auto pt-2">
                    <div className="text-primary font-black text-lg sm:text-xl">
                      Rp {(product.price / 1000).toLocaleString()}k
                    </div>
                    <div className="bg-gray-100 p-2 rounded-xl group-hover:bg-orange-100 transition-colors">
                      <Plus className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                    </div>
                  </div>

                  {!isAvailable && (
                    <div className="absolute top-2 right-2 bg-red-100 text-red-600 text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Habis
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Sidebar: Cart */}
        <div className="hidden lg:block w-96">
          <div className="card sticky top-24 max-h-[calc(100vh-120px)] flex flex-col shadow-lg border-gray-200">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <div className="flex items-center gap-2 font-black text-xl text-gray-900">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                Keranjang
              </div>
              <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)} item
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2 min-h-[200px]">
              {cart.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <ShoppingCart className="w-10 h-10" />
                  </div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Kosong</div>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="group bg-gray-50/50 p-4 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-orange-50/30 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="pr-4">
                        <div className="font-bold text-sm text-gray-900 leading-tight mb-1">{item.name}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Rp {item.price.toLocaleString()}</div>
                      </div>
                      <div className="font-black text-sm text-primary">
                        Rp {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black w-8 text-center text-gray-700">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 space-y-4 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Bayar</span>
                <span className="text-primary font-black text-2xl">Rp {total.toLocaleString()}</span>
              </div>

              {paymentMethod === "TUNAI" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 block">Uang Diterima</label>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setUangDiterima("50.000")}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:border-primary hover:text-primary transition-all active:scale-95"
                      >
                        50.000
                      </button>
                      <button
                        onClick={() => setUangDiterima("100.000")}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:border-primary hover:text-primary transition-all active:scale-95"
                      >
                        100.000
                      </button>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={uangDiterima}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setUangDiterima(value ? parseInt(value).toLocaleString() : "");
                      }}
                      placeholder="Masukkan nominal"
                      className="input"
                    />
                  </div>

                  {uangDiterimaNum >= total && kembalian > 0 && (
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-xs font-bold uppercase tracking-widest">Kembalian</span>
                        <span className="text-green-700 font-black text-lg">Rp {kembalian.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod("TUNAI")}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition-all",
                    paymentMethod === "TUNAI"
                      ? "border-primary bg-orange-50 text-primary shadow-sm"
                      : "border-gray-50 bg-gray-50 text-gray-400 grayscale"
                  )}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Tunai</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("QRIS")}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition-all",
                    paymentMethod === "QRIS"
                      ? "border-primary bg-orange-50 text-primary shadow-sm"
                      : "border-gray-50 bg-gray-50 text-gray-400 grayscale"
                  )}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">QRIS</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("GRAB")}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition-all",
                    paymentMethod === "GRAB"
                      ? "border-primary bg-orange-50 text-primary shadow-sm"
                      : "border-gray-50 bg-gray-50 text-gray-400 grayscale"
                  )}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Grab</span>
                </button>
              </div>

              <button
                disabled={cart.length === 0 || loading || !activeCashier}
                onClick={handleCheckout}
                className="btn-primary w-full py-4 text-lg font-black uppercase tracking-widest flex items-center justify-center gap-3 rounded-2xl"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Checkout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar: Cart Summary Toggle */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-4">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="w-full bg-primary text-white p-4 rounded-2xl shadow-xl flex items-center justify-between active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">Total Pesanan</span>
              <span className="font-black text-lg leading-none">Rp {total.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-bold text-sm bg-white/10 px-4 py-2 rounded-xl">
            {cart.reduce((s, i) => s + i.quantity, 0)} Item
            <ChevronUp className="w-4 h-4 animate-bounce" />
          </div>
        </button>
      </div>

      {/* Mobile Cart Drawer/Overlay */}
      {isMobileCartOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white z-[101] rounded-t-[32px] flex flex-col max-h-[90vh] shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-gray-900">Keranjang</h2>
              </div>
              <button 
                onClick={() => setIsMobileCartOpen(false)}
                className="p-2 bg-gray-100 rounded-full text-gray-400 active:scale-90 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart className="w-16 h-16 mx-auto text-gray-100 mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest">Kosong</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-4 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-gray-900 pr-4">{item.name}</div>
                      <div className="font-black text-primary">Rp {(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-gray-200">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-black w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2.5 text-red-500 bg-red-50 rounded-xl active:scale-90 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 pt-2 bg-white border-t border-gray-100 space-y-6">
              <div className="flex justify-between items-center px-1">
                <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Total Bayar</span>
                <span className="text-2xl font-black text-primary">Rp {total.toLocaleString()}</span>
              </div>

              {paymentMethod === "TUNAI" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 block">Uang Diterima</label>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setUangDiterima("50.000")}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:border-primary hover:text-primary transition-all active:scale-95"
                      >
                        50.000
                      </button>
                      <button
                        onClick={() => setUangDiterima("100.000")}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:border-primary hover:text-primary transition-all active:scale-95"
                      >
                        100.000
                      </button>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={uangDiterima}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setUangDiterima(value ? parseInt(value).toLocaleString() : "");
                      }}
                      placeholder="Masukkan nominal"
                      className="input"
                    />
                  </div>

                  {uangDiterimaNum >= total && kembalian > 0 && (
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-xs font-bold uppercase tracking-widest">Kembalian</span>
                        <span className="text-green-700 font-black text-lg">Rp {kembalian.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod("TUNAI")}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border-2 transition-all",
                    paymentMethod === "TUNAI" ? "border-primary bg-orange-50 text-primary" : "border-gray-50 bg-gray-50 text-gray-400 grayscale"
                  )}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase">Tunai</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("QRIS")}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border-2 transition-all",
                    paymentMethod === "QRIS" ? "border-primary bg-orange-50 text-primary" : "border-gray-50 bg-gray-50 text-gray-400 grayscale"
                  )}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase">QRIS</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("GRAB")}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border-2 transition-all",
                    paymentMethod === "GRAB" ? "border-primary bg-orange-50 text-primary" : "border-gray-50 bg-gray-50 text-gray-400 grayscale"
                  )}
                >
                  <Smartphone className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase">Grab</span>
                </button>
              </div>

              <button
                disabled={cart.length === 0 || loading || !activeCashier}
                onClick={() => {
                  handleCheckout();
                  setIsMobileCartOpen(false);
                }}
                className="btn-primary w-full py-5 text-xl font-black uppercase tracking-widest rounded-[20px] shadow-lg shadow-primary/20"
              >
                {loading ? "Memproses..." : "Checkout Sekarang"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast Message */}
      {message && (
        <div
          className={clsx(
            "fixed top-20 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-[200] transition-all animate-bounce font-bold",
            message.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          )}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
