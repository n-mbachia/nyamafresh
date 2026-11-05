/* Number, Pochi number and endpoint come from .env at build time. Prices, packs and zones are edited here. */
const CONFIG = {
  ORDER_ENDPOINT: "",
  WHATSAPP_NUMBER: "254726290569",
  POCHI_NUMBER: "",    // shown to customers for M-Pesa Pochi la Biashara
  MIN_ORDER: 1500,                   // KES, minimum meat subtotal for pack orders
  CUTOFF_TEXT: "Order by 8pm the evening before",
  SLOTS: ["Wednesday", "Saturday"],
  GOAT_LEAD_DAYS: 3,                 // notice needed for goat orders
  GOAT_DEPOSIT: 0.5,                 // share paid at booking; balance after weighing, before dispatch
  GOAT_PRICE_KG: 800,                // KES per kg dressed weight
  FEE_RATE: 0.20                     // convenience fee, as a share of the meat subtotal
};
/* Delivery fee is paid to the rider on arrival. fee: null means "we confirm on WhatsApp". */
const ZONES = [
  { id: "a", name: "Kikuyu town, Kidfarmaco (up to 3 km)", fee: 150 },
  { id: "b", name: "Kinoo, Thogoto, Nderi (3 to 6 km)",    fee: 300 },
  { id: "c", name: "Further out (we confirm the fee)",     fee: null }
];
/* price is per unit shown. Beef 550/kg, goat 600/kg, mince 400 per 500 g */
const PACKS = [
  { id: "stew",  name: "Beef Stew Pack",   unit: "per kg",    note: "1 kg of cleaned, boneless beef cubes, ready for your favourite homemade stew.",      price: 700 },
  { id: "pilau", name: "Pilau Pack",       unit: "per kg",    note: "1 kg of flavourful bone-in beef pieces, cut for pilau.",                             price: 600 },
  { id: "mince", name: "Beef Mince Pack",  unit: "per 500 g", note: "500 g of freshly ground beef, ideal for mince dishes, meatballs and burgers.",       price: 450 },
  { id: "choma", name: "Nyama Choma Pack", unit: "per kg",    note: "1 kg of goat ribs and chops, ready for the grill.",                                  price: 800 },
  { id: "gstew", name: "Goat Stew Pack",   unit: "per kg",    note: "1 kg of goat meat, cut into convenient bone-in stew pieces.",                        price: 800 }
];
/* Box prices are the meat subtotal of the mix in the note, at the per-kg prices above */
const BOXES = [
  { id: "s", name: "Small family box",  note: "About 2 kg: 1.5 kg beef, 500 g mince, 500 g goat",   price: 1750 },
  { id: "m", name: "Medium family box", note: "About 3.5 kg: 2 kg beef, 500 g mince, 1 kg goat",  price: 2450 },
  { id: "l", name: "Large family box",  note: "About 6 kg: 3 kg beef, 1 kg mince, 2 kg goat",     price: 4300 }
];
const GOATS = [
  { id: "half",  name: "Half goat",  note: "About 6 to 8 kg dressed",   kg: 7 },
  { id: "whole", name: "Whole goat", note: "About 12 to 16 kg dressed", kg: 14 }
];
const GOAT_CUTS = ["Nyama choma cut (ribs and chops)", "Stew pieces", "Mixed: half choma, half stew"];
