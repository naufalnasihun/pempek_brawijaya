export type IngredientName = "Kapal Selam Kecil" | "Kapal Selam Besar" | "Lenjer" | "Moza";

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
    id: "paket-hemat",
    name: "Paket Hemat",
    price: 5000,
    ingredients: [{ name: "Kapal Selam Kecil", quantity: 3 }],
  },
  {
    id: "paket-nyoba",
    name: "Paket Nyoba",
    price: 10000,
    ingredients: [{ name: "Kapal Selam Kecil", quantity: 5 }],
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
    price: 10000,
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
      { name: "Lenjer", quantity: 2 },
    ],
  },
  {
    id: "paket-super-duper-mantul",
    name: "Paket Super Duper Mantul",
    price: 25000,
    ingredients: [
      { name: "Kapal Selam Besar", quantity: 1 },
      { name: "Lenjer", quantity: 2 },
      { name: "Kapal Selam Kecil", quantity: 3 },
    ],
  },
];

export const INGREDIENTS: IngredientName[] = [
  "Kapal Selam Kecil",
  "Kapal Selam Besar",
  "Lenjer",
  "Moza",
];
