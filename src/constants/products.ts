export type IngredientName = "Kapal Selam Kecil" | "Kapal Selam Besar" | "Lenjer" | "Moza" | "Kripik";

export interface Product {
  id: string;
  name: string;
  price: number;
  ingredients: {
    name: IngredientName;
    quantity: number;
  }[];
}

export const PRODUCTS: Product[] = [
  {
    id: "paket-nyoba",
    name: "Paket Nyoba",
    price: 10000,
    ingredients: [
      { name: "Kapal Selam Kecil", quantity: 2 },
      { name: "Lenjer", quantity: 1 },
    ],
  },
  {
    id: "paket-lenjer",
    name: "Paket Lenjer",
    price: 10000,
    ingredients: [{ name: "Lenjer", quantity: 2 }],
  },
  {
    id: "paket-gembul",
    name: "Paket Gembul",
    price: 12000,
    ingredients: [{ name: "Kapal Selam Besar", quantity: 1 }],
  },
  {
    id: "paket-mantul",
    name: "Paket Mantul",
    price: 15000,
    ingredients: [
      { name: "Kapal Selam Besar", quantity: 1 },
      { name: "Lenjer", quantity: 1 },
    ],
  },
  {
    id: "paket-new-mozarella",
    name: "Paket New Mozarella",
    price: 15000,
    ingredients: [{ name: "Moza", quantity: 3 }],
  },
  {
    id: "paket-super-mantul",
    name: "Paket Super Mantul",
    price: 20000,
    ingredients: [
      { name: "Kapal Selam Besar", quantity: 1 },
      { name: "Kapal Selam Kecil", quantity: 1 },
      { name: "Lenjer", quantity: 1 },
    ],
  },
  {
    id: "paket-super-duper-komplit",
    name: "Paket Super Duper Komplit",
    price: 25000,
    ingredients: [
      { name: "Kapal Selam Besar", quantity: 1 },
      { name: "Kapal Selam Kecil", quantity: 2 },
      { name: "Lenjer", quantity: 1 },
      { name: "Kripik", quantity: 1 },
    ],
  },
];

export const INGREDIENTS: IngredientName[] = [
  "Kapal Selam Kecil",
  "Kapal Selam Besar",
  "Lenjer",
  "Moza",
  "Kripik",
];
