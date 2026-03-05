export interface MFCategoryDef {
  name: string;
  subCategories: {
    name: string;
    pattern: RegExp;
  }[];
}

export const MF_CATEGORIES: MFCategoryDef[] = [
  // Index/ETFs checked FIRST to prevent "Nifty Small Cap Index" matching Equity > Small Cap
  {
    name: 'Index / ETFs',
    subCategories: [
      { name: 'Nifty / Sensex', pattern: /nifty|sensex|s&p\s*bse/i },
      { name: 'Other Index', pattern: /index/i },
      { name: 'ETFs', pattern: /etf/i },
    ],
  },
  {
    name: 'International',
    subCategories: [
      { name: 'US', pattern: /us\s*equity|nasdaq|s&p\s*500/i },
      { name: 'Global', pattern: /international|global|world|overseas/i },
      { name: 'Emerging', pattern: /emerging/i },
    ],
  },
  {
    name: 'Equity',
    subCategories: [
      { name: 'Large & Mid Cap', pattern: /large\s*(&|and)\s*mid\s*cap/i },
      { name: 'Large Cap', pattern: /large\s*cap|bluechip/i },
      { name: 'Mid Cap', pattern: /mid\s*cap/i },
      { name: 'Small Cap', pattern: /small\s*cap/i },
      { name: 'Multi Cap', pattern: /multi\s*cap/i },
      { name: 'Flexi Cap', pattern: /flexi\s*cap/i },
      { name: 'Value / Contra', pattern: /value|contra/i },
      { name: 'Dividend Yield', pattern: /dividend\s*yield/i },
      { name: 'Focused', pattern: /focused/i },
      { name: 'ELSS', pattern: /elss|tax\s*sav/i },
      { name: 'Sector / Thematic', pattern: /sector|themat|pharma|banking|tech|infra|consumption|energy|psu|mnc|commodit/i },
    ],
  },
  {
    name: 'Debt',
    subCategories: [
      { name: 'Overnight', pattern: /overnight/i },
      { name: 'Liquid', pattern: /liquid/i },
      { name: 'Ultra Short Duration', pattern: /ultra\s*short/i },
      { name: 'Money Market', pattern: /money\s*market/i },
      { name: 'Low Duration', pattern: /low\s*duration/i },
      { name: 'Short Duration', pattern: /short\s*(term|duration)/i },
      { name: 'Medium Duration', pattern: /medium\s*(term|duration)/i },
      { name: 'Medium to Long Duration', pattern: /medium\s*to\s*long/i },
      { name: 'Long Duration', pattern: /long\s*(term|duration)/i },
      { name: 'Corporate Bond', pattern: /corporate\s*bond/i },
      { name: 'Credit Risk', pattern: /credit\s*risk/i },
      { name: 'Banking & PSU', pattern: /banking\s*(&|and)\s*psu/i },
      { name: 'Gilt', pattern: /gilt|government\s*sec/i },
      { name: 'Floater', pattern: /floater|floating/i },
      { name: 'Dynamic Bond', pattern: /dynamic\s*bond/i },
    ],
  },
  {
    name: 'Hybrid',
    subCategories: [
      { name: 'Aggressive', pattern: /aggressive\s*hybrid/i },
      { name: 'Conservative', pattern: /conservative\s*hybrid/i },
      { name: 'Dynamic Asset Allocation', pattern: /balanced\s*advantage|dynamic\s*asset/i },
      { name: 'Multi Asset', pattern: /multi\s*asset/i },
      { name: 'Arbitrage', pattern: /arbitrage/i },
      { name: 'Equity Savings', pattern: /equity\s*savings/i },
    ],
  },
  {
    name: 'Solution Oriented',
    subCategories: [
      { name: 'Retirement', pattern: /retirement|pension/i },
      { name: "Children's", pattern: /child|children/i },
    ],
  },
  {
    name: 'Fund of Funds',
    subCategories: [
      { name: 'Domestic FoF', pattern: /fund\s*of\s*fund|fof/i },
    ],
  },
];

export const CATEGORY_DISPLAY_ORDER = [
  'Equity',
  'Debt',
  'Hybrid',
  'Index / ETFs',
  'Solution Oriented',
  'International',
  'Fund of Funds',
];

export function classifyFund(schemeName: string): { category: string; subCategory: string } {
  for (const cat of MF_CATEGORIES) {
    for (const sub of cat.subCategories) {
      if (sub.pattern.test(schemeName)) {
        return { category: cat.name, subCategory: sub.name };
      }
    }
  }
  return { category: 'Other', subCategory: 'Uncategorized' };
}
