import { Product, INGREDIENTS } from "@/constants/products";

export interface Ingredient {
  name: string;
  stock: number;
}

export interface Cashier {
  id: string;
  name: string;
}

export interface TransactionItem {
  productName: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: string;
  cashierName: string;
  total: number;
  paymentMethod: string;
  items: TransactionItem[];
  createdAt: string;
  shift: string; // "Shift 1" or "Shift 2"
}

export interface StockHistory {
  id: string;
  ingredientName: string;
  change: number;
  type: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  CASHIERS: "pempek_cashiers",
  INGREDIENTS: "pempek_ingredients",
  TRANSACTIONS: "pempek_transactions",
  STOCK_HISTORY: "pempek_stock_history",
  CURRENT_SHIFT: "pempek_current_shift",
  LAST_RESET_DATE: "pempek_last_reset_date",
};

// Default Initial Data
const DEFAULT_CASHIERS: Cashier[] = [
  { id: "1", name: "Naufal" },
  { id: "2", name: "Sari" },
  { id: "3", name: "Ade" },
];

const DEFAULT_INGREDIENTS: Ingredient[] = INGREDIENTS.map((name) => ({
  name,
  stock: 0,
}));

export const LocalData = {
  // --- INTERNAL UTILS ---
  checkAutoReset: () => {
    if (typeof window === "undefined") return;
    
    const today = new Date().toLocaleDateString();
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);
    
    if (lastReset !== today) {
      // 1. Reset Stock to 0
      localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(DEFAULT_INGREDIENTS));
      
      // 2. Clear Today's History (Optional, keeping history for now)
      // localStorage.removeItem(STORAGE_KEYS.STOCK_HISTORY);
      
      // 3. Update last reset date
      localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
      console.log("Stok otomatis di-reset ke 0 untuk hari baru.");
    }
  },

  clearAllData: () => {
    if (typeof window === "undefined") return;
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    // Re-initialize with defaults
    localStorage.setItem(STORAGE_KEYS.CASHIERS, JSON.stringify(DEFAULT_CASHIERS));
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(DEFAULT_INGREDIENTS));
    localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, new Date().toLocaleDateString());
  },

  // --- CASHIERS ---
  getCashiers: (): Cashier[] => {
    if (typeof window === "undefined") return DEFAULT_CASHIERS;
    LocalData.checkAutoReset();
    const data = localStorage.getItem(STORAGE_KEYS.CASHIERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CASHIERS, JSON.stringify(DEFAULT_CASHIERS));
      return DEFAULT_CASHIERS;
    }
    return JSON.parse(data);
  },
  saveCashier: (name: string): Cashier => {
    const cashiers = LocalData.getCashiers();
    const newCashier = { id: Math.random().toString(36).substr(2, 9), name };
    const updated = [...cashiers, newCashier];
    localStorage.setItem(STORAGE_KEYS.CASHIERS, JSON.stringify(updated));
    return newCashier;
  },

  // --- INGREDIENTS ---
  getIngredients: (): Ingredient[] => {
    if (typeof window === "undefined") return DEFAULT_INGREDIENTS;
    LocalData.checkAutoReset();
    const data = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(DEFAULT_INGREDIENTS));
      return DEFAULT_INGREDIENTS;
    }
    const existingIngredients = JSON.parse(data);
    // Ensure all new ingredients are added with 0 stock
    const mergedIngredients = DEFAULT_INGREDIENTS.map(defaultIng => {
      const existing = existingIngredients.find((e: Ingredient) => e.name === defaultIng.name);
      return existing || { ...defaultIng, stock: 0 };
    });
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(mergedIngredients));
    return mergedIngredients;
  },
  updateStock: (name: string, change: number): Ingredient[] => {
    const ingredients = LocalData.getIngredients();
    const updated = ingredients.map((ing) =>
      ing.name === name ? { ...ing, stock: Math.max(0, ing.stock + change) } : ing
    );
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(updated));
    
    // Add to history
    LocalData.addStockHistory(name, change);
    
    return updated;
  },

  // --- STOCK HISTORY ---
  getStockHistory: (): StockHistory[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.STOCK_HISTORY);
    return data ? JSON.parse(data) : [];
  },
  addStockHistory: (ingredientName: string, change: number) => {
    const history = LocalData.getStockHistory();
    const newItem: StockHistory = {
      id: Math.random().toString(36).substr(2, 9),
      ingredientName,
      change,
      type: change >= 0 ? "ADD" : "REDUCE",
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...history].slice(0, 100); // Keep last 100
    localStorage.setItem(STORAGE_KEYS.STOCK_HISTORY, JSON.stringify(updated));
  },

  // --- TRANSACTIONS ---
  getTransactions: (): Transaction[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  saveTransaction: (transaction: Omit<Transaction, "id" | "createdAt" | "shift">): Transaction => {
    const transactions = LocalData.getTransactions();
    const currentShift = LocalData.getCurrentShift();
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      shift: currentShift,
    };
    const updated = [newTransaction, ...transactions];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));

    // Deduct stock for each item in transaction
    // This logic should be handled by the caller or here
    return newTransaction;
  },

  // --- SHIFT MANAGEMENT ---
  getCurrentShift: (): string => {
    if (typeof window === "undefined") return "Shift 1";
    const shift = localStorage.getItem(STORAGE_KEYS.CURRENT_SHIFT);
    return shift || "Shift 1";
  },
  setCurrentShift: (shift: string) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT, shift);
  },
};
