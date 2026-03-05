export interface MutualFundBasic {
  schemeCode: number;
  schemeName: string;
}

export interface MutualFundDetail {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  data: Array<{
    date: string;
    nav: string;
  }>;
}

export interface MutualFundProcessed {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  category: string;
  currentNAV: number;
  return1Y?: number;
  return3Y?: number;
  return5Y?: number;
  high52W?: number;
  low52W?: number;
}

export interface MFCategory {
  name: string;
  subCategories: MFSubCategory[];
}

export interface MFSubCategory {
  name: string;
  pattern: RegExp;
}
