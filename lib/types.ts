export type Option = { label: string; price: number };
export type Customisation = { name: string; type: 'single' | 'multi'; options: Option[] };
export type Item = {
  id: string; category: string; name: string; description: string; price: number; veg: boolean; image: string;
  bestseller?: boolean; chefSpecial?: boolean; spice?: number; available: boolean; customisations?: Customisation[];
};
export type Category = { id: string; name: string };
export type Settings = {
  cafeName: string; logo: string; currency: string; taxRate: number; taxLabel: string;
  orderingEnabled: boolean; orderingDemo: boolean;
};
export type Menu = { settings: Settings; categories: Category[]; items: Item[] };
