import {
  BrickWall,
  Briefcase,
  Bug,
  Cctv,
  Droplets,
  Flame,
  Hammer,
  PaintRoller,
  PlugZap,
  Snowflake,
  Sparkles,
  Sprout,
  Sun,
  Truck,
  Wrench,
} from "lucide-react";
import type { ServiceCategory } from "../types";

export interface CategoryOption {
  id: ServiceCategory;
  name: string;
  urduName: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  subCategories?: string[];
  suggestedFee: number;
  popular?: boolean;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: "plumber",
    name: "Plumber",
    urduName: "پلمبر",
    subtitle: "Pipes, Sanitary & Leaks",
    icon: Droplets,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-200/60",
    suggestedFee: 500,
    popular: true,
  },
  {
    id: "electrician",
    name: "Electrician",
    urduName: "الیکٹریشن",
    subtitle: "Wiring, DB & Short Circuits",
    icon: PlugZap,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50 border-amber-200/60",
    suggestedFee: 500,
    popular: true,
  },
  {
    id: "ac-technician",
    name: "AC Technician",
    urduName: "اے سی سروس",
    subtitle: "Inverter Gas & Servicing",
    icon: Snowflake,
    iconColor: "text-[#0F8B8D]",
    iconBg: "bg-teal-50 border-teal-200/60",
    suggestedFee: 500,
    popular: true,
  },
  {
    id: "carpenter",
    name: "Carpenter",
    urduName: "بڑھئی / کارپینٹر",
    subtitle: "Doors, Furniture & Locks",
    icon: Hammer,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50 border-orange-200/60",
    suggestedFee: 500,
    popular: true,
  },
  {
    id: "painter",
    name: "Painter",
    urduName: "پینٹر",
    subtitle: "Interior, Wall Putty & Polish",
    icon: PaintRoller,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50 border-purple-200/60",
    suggestedFee: 500,
  },
  {
    id: "cleaner",
    name: "Home Cleaner",
    urduName: "صفائی",
    subtitle: "Deep Cleaning & Sofas",
    icon: Sparkles,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 border-emerald-200/60",
    suggestedFee: 500,
  },
  {
    id: "solar-technician",
    name: "Solar & UPS",
    urduName: "سولر اور یو پی ایس",
    subtitle: "Panels, Inverters & Wiring",
    icon: Sun,
    iconColor: "text-yellow-600",
    iconBg: "bg-yellow-50 border-yellow-200/60",
    suggestedFee: 500,
  },
  {
    id: "welder",
    name: "Welder",
    urduName: "ویلڈر",
    subtitle: "Iron Gates, Grills & Sheds",
    icon: Flame,
    iconColor: "text-red-600",
    iconBg: "bg-red-50 border-red-200/60",
    suggestedFee: 500,
  },
  {
    id: "cctv-security",
    name: "CCTV & Security",
    urduName: "سی سی ٹی وی کیمرے",
    subtitle: "Camera Setup & Intercom",
    icon: Cctv,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50 border-indigo-200/60",
    suggestedFee: 500,
  },
  {
    id: "mason-mistry",
    name: "Mason (Mistry)",
    urduName: "مستری / ٹائلیں",
    subtitle: "Tiles, Plaster & Renovation",
    icon: BrickWall,
    iconColor: "text-stone-600",
    iconBg: "bg-stone-50 border-stone-200/60",
    suggestedFee: 500,
  },
  {
    id: "gardener",
    name: "Gardener (Mali)",
    urduName: "مالی / باغبان",
    subtitle: "Lawn Mowing & Plants Care",
    icon: Sprout,
    iconColor: "text-lime-600",
    iconBg: "bg-lime-50 border-lime-200/60",
    suggestedFee: 500,
  },
  {
    id: "pest-control",
    name: "Pest Control",
    urduName: "کیڑے مار ادویات",
    subtitle: "Termite & Cockroach Spray",
    icon: Bug,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50 border-rose-200/60",
    suggestedFee: 500,
  },
  {
    id: "movers",
    name: "Movers & Packers",
    urduName: "شفٹنگ اور ٹرانسپورٹ",
    subtitle: "House Shifting & Luggage",
    icon: Truck,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50 border-sky-200/60",
    suggestedFee: 500,
  },
  {
    id: "handyman",
    name: "General Handyman",
    urduName: "عمومی مہارت",
    subtitle: "Drilling, Hangings & Small Repairs",
    icon: Wrench,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50 border-teal-200/60",
    suggestedFee: 500,
  },
];

export const POPULAR_SEARCH_TAGS = [
  { label: "⚡ AC Service", urduLabel: "⚡ اے سی سروس", category: "ac-technician" },
  { label: "🔧 Plumbing Repair", urduLabel: "🔧 پلمبنگ مرمت", category: "plumber" },
  { label: "💡 Electrician Visit", urduLabel: "💡 الیکٹریشن وزٹ", category: "electrician" },
  { label: "🪑 Carpenter Service", urduLabel: "🪑 بڑھئی سروس", category: "carpenter" },
  { label: "☀️ Solar & UPS", urduLabel: "☀️ سولر اور یو پی ایس", category: "solar-technician" },
];

export const PESHAWAR_AREAS = [
  "Central District",
  "University Town",
  "Hayatabad Phase 1-3",
  "Hayatabad Phase 4-7",
  "Saddar & Cantt",
  "Gulbahar & City Area",
  "Warsak Road Sector",
  "Ring Road Belt",
  "DHA Phase 1",
  "Model Town",
  "Kohat Road Belt",
  "Dalazak Road",
  "Charsadda Road",
  "Board Bazaar",
];

export const SERVICE_AREAS = PESHAWAR_AREAS;

export const CATEGORY_ALIASES: Record<string, ServiceCategory> = {
  cleaning: "cleaner",
  clean: "cleaner",
  "deep-cleaning": "cleaner",
  "deep-clean": "cleaner",
  "home-cleaning": "cleaner",
  cleaner: "cleaner",
  cctv: "cctv-security",
  security: "cctv-security",
  "cctv-security": "cctv-security",
  "cctv_security": "cctv-security",
  "cctv-camera": "cctv-security",
  cameras: "cctv-security",
  camera: "cctv-security",
  mason: "mason-mistry",
  mistri: "mason-mistry",
  mistry: "mason-mistry",
  masonry: "mason-mistry",
  "mason-mistry": "mason-mistry",
  solar: "solar-technician",
  "solar-panel": "solar-technician",
  "solar-technician": "solar-technician",
  "solar_technician": "solar-technician",
  ups: "solar-technician",
  geyser: "plumber",
  heating: "plumber",
  "water-tank": "cleaner",
  tank: "cleaner",
  plumber: "plumber",
  plumb: "plumber",
  electrician: "electrician",
  electric: "electrician",
  electricity: "electrician",
  ac: "ac-technician",
  "ac-technician": "ac-technician",
  hvac: "ac-technician",
  aircon: "ac-technician",
  carpenter: "carpenter",
  carpentry: "carpenter",
  woodwork: "carpenter",
  painter: "painter",
  paint: "painter",
  welder: "welder",
  weld: "welder",
  welding: "welder",
  gardener: "gardener",
  garden: "gardener",
  mali: "gardener",
  "pest-control": "pest-control",
  pest: "pest-control",
  fumigation: "pest-control",
  movers: "movers",
  mover: "movers",
  shifting: "movers",
  transport: "movers",
  "movers & packers": "movers",
  "movers-packers": "movers",
  "solar & ups": "solar-technician",
  "solar-ups": "solar-technician",
  "ac & refrigeration": "ac-technician",
  "ac-refrigeration": "ac-technician",
  "gardener (mali)": "gardener",
  "gardener-mali": "gardener",
  handyman: "handyman",
  "general handyman": "handyman",
  "general-handyman": "handyman",
  general: "handyman",
  "seed-category-1": "plumber",
  "seed-category-2": "electrician",
  "seed-category-3": "ac-technician",
  "seed-category-4": "carpenter",
  "seed-category-5": "painter",
  "seed-category-6": "cleaner",
  "seed-category-7": "mason-mistry",
  "seed-category-8": "pest-control",
  "seed-category-9": "handyman",
  "seed-category-10": "solar-technician",
  "seed-category-11": "cctv-security",
  "seed-category-12": "welder",
  "seed-category-13": "gardener",
  "seed-category-14": "movers",
};

export function createCustomCategoryOption(
  id: string,
  name: string,
  urduName?: string,
  fee?: number
): CategoryOption {
  const cleanName = (name || id || "Custom Service").trim();
  return {
    id: id as ServiceCategory,
    name: cleanName,
    urduName: urduName || cleanName,
    subtitle: `${cleanName} Services & Repair`,
    icon: Briefcase,
    iconColor: "text-[#0F8B8D]",
    iconBg: "bg-teal-50 border-teal-200/60",
    suggestedFee: fee || 500,
  };
}

export function resolveCategoryOption(
  query: string | null | undefined
): CategoryOption | undefined {
  if (!query) return undefined;
  const normalized = query.trim().toLowerCase();

  // 1. Exact ID match
  const directMatch = CATEGORY_OPTIONS.find(
    (c) => c.id.toLowerCase() === normalized
  );
  if (directMatch) return directMatch;

  // 2. Alias dictionary
  const mappedCategory = CATEGORY_ALIASES[normalized];
  if (mappedCategory) {
    const found = CATEGORY_OPTIONS.find((c) => c.id === mappedCategory);
    if (found) return found;
  }

  // 3. Substring match against name, Urdu name, or subtitle
  return CATEGORY_OPTIONS.find(
    (cat) =>
      cat.name.toLowerCase().includes(normalized) ||
      cat.urduName.includes(normalized) ||
      cat.subtitle.toLowerCase().includes(normalized)
  );
}
