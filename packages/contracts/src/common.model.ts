export type AppLang = 'en' | 'th';

export interface PriceData {
  symbol: string;
  name?: string;
  nameTh?: string;
  price: number;
  currency: string;
}
