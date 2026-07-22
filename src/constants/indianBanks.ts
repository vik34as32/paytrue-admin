import {
  LOCAL_INDIAN_BANKS,
  findLocalBankByName,
  getLocalBankLogoPath,
} from "@/constants/localIndianBanks";

export interface IndianBank {
  /** 4-letter IFSC bank code */
  code: string;
  name: string;
}

const RAW_INDIAN_BANKS: IndianBank[] = [
  { code: "ABHY", name: "Abhyudaya Co-operative Bank" },
  { code: "ADCC", name: "Akola District Central Co-operative Bank" },
  { code: "AIRP", name: "Airtel Payments Bank" },
  { code: "AMCB", name: "Ahmedabad Mercantile Co-operative Bank" },
  { code: "APGB", name: "Andhra Pradesh Grameena Vikas Bank" },
  { code: "APGV", name: "Andhra Pragathi Grameena Bank" },
  { code: "ASBL", name: "Apna Sahakari Bank" },
  { code: "AUBL", name: "AU Small Finance Bank" },
  { code: "UTIB", name: "Axis Bank" },
  { code: "BDBL", name: "Bandhan Bank" },
  { code: "BARC", name: "Barclays Bank" },
  { code: "BACB", name: "Bassein Catholic Co-operative Bank" },
  { code: "BARB", name: "Bank of Baroda" },
  { code: "BCBM", name: "Bharat Co-operative Bank" },
  { code: "BKID", name: "Bank of India" },
  { code: "BNPA", name: "BNP Paribas" },
  { code: "BMCB", name: "Bombay Mercantile Co-operative Bank" },
  { code: "CNRB", name: "Canara Bank" },
  { code: "CLBL", name: "Capital Small Finance Bank" },
  { code: "CCBL", name: "Citizen Credit Co-operative Bank" },
  { code: "CITI", name: "Citibank" },
  { code: "CIUB", name: "City Union Bank" },
  { code: "CBIN", name: "Central Bank of India" },
  { code: "COSB", name: "Cosmos Co-operative Bank" },
  { code: "CRLY", name: "Credit Agricole Corporate Bank" },
  { code: "CSBK", name: "CSB Bank" },
  { code: "DBSS", name: "DBS Bank India" },
  { code: "DCBL", name: "DCB Bank" },
  { code: "DEUT", name: "Deutsche Bank" },
  { code: "DLXB", name: "Dhanlaxmi Bank" },
  { code: "DNSB", name: "Dombivli Nagari Sahakari Bank" },
  { code: "ESAF", name: "ESAF Small Finance Bank" },
  { code: "ESFB", name: "Equitas Small Finance Bank" },
  { code: "FDRL", name: "Federal Bank" },
  { code: "FINO", name: "Fino Payments Bank" },
  { code: "FSFB", name: "Fincare Small Finance Bank" },
  { code: "GSCB", name: "Gujarat State Co-operative Bank" },
  { code: "HCBL", name: "Hasti Co-operative Bank" },
  { code: "HDFC", name: "HDFC Bank" },
  { code: "HPSC", name: "Himachal Pradesh State Co-operative Bank" },
  { code: "HSBC", name: "HSBC Bank" },
  { code: "IBKL", name: "IDBI Bank" },
  { code: "ICIC", name: "ICICI Bank" },
  { code: "ICBK", name: "Industrial and Commercial Bank of China" },
  { code: "IDFB", name: "IDFC FIRST Bank" },
  { code: "IDIB", name: "Indian Bank" },
  { code: "IOBA", name: "Indian Overseas Bank" },
  { code: "INDB", name: "IndusInd Bank" },
  { code: "IPOS", name: "India Post Payments Bank" },
  { code: "IBKO", name: "Industrial Bank of Korea" },
  { code: "JAKA", name: "Jammu & Kashmir Bank" },
  { code: "JJSB", name: "Jalgaon Janata Sahakari Bank" },
  { code: "JIOP", name: "Jio Payments Bank" },
  { code: "JPCB", name: "Jalgaon Peoples Co-operative Bank" },
  { code: "JSFB", name: "Jana Small Finance Bank" },
  { code: "KACE", name: "Kangra Central Co-operative Bank" },
  { code: "KAIJ", name: "Kallappanna Awade Ichalkaranji Janata Sahakari Bank" },
  { code: "KANG", name: "Kangra Co-operative Bank" },
  { code: "KCCB", name: "Kalupur Commercial Co-operative Bank" },
  { code: "KDCB", name: "Kozhikode District Co-operative Bank" },
  { code: "KJSB", name: "Kalyan Janata Sahakari Bank" },
  { code: "KKBK", name: "Kotak Mahindra Bank" },
  { code: "KNSB", name: "Kurmanchal Nagar Sahakari Bank" },
  { code: "KARB", name: "Karnataka Bank" },
  { code: "KVBL", name: "Karur Vysya Bank" },
  { code: "KVGB", name: "Karnataka Vikas Grameena Bank" },
  { code: "KSCB", name: "Karnataka State Co-operative Apex Bank" },
  { code: "MAHB", name: "Bank of Maharashtra" },
  { code: "MAHG", name: "Maharashtra Gramin Bank" },
  { code: "MCBL", name: "Maharashtra Co-operative Bank" },
  { code: "MSCI", name: "Maharashtra State Co-operative Bank" },
  { code: "MSNU", name: "Mehsana Urban Co-operative Bank" },
  { code: "MUBL", name: "Municipal Co-operative Bank" },
  { code: "NCBL", name: "National Co-operative Bank" },
  { code: "NESF", name: "North East Small Finance Bank" },
  { code: "NKGS", name: "NKGSB Co-operative Bank" },
  { code: "NSPB", name: "NSDL Payments Bank" },
  { code: "NTBL", name: "Nainital Bank" },
  { code: "PMCB", name: "Punjab & Maharashtra Co-operative Bank" },
  { code: "PRTH", name: "Prathama UP Gramin Bank" },
  { code: "PUNB", name: "Punjab National Bank" },
  { code: "PSIB", name: "Punjab & Sind Bank" },
  { code: "PUSD", name: "Pusad Urban Co-operative Bank" },
  { code: "PYTM", name: "Paytm Payments Bank" },
  { code: "RATN", name: "RBL Bank" },
  { code: "RNSB", name: "Rajkot Nagarik Sahakari Bank" },
  { code: "RSBL", name: "Rajgurunagar Sahakari Bank" },
  { code: "SABR", name: "SBER Bank" },
  { code: "SRCB", name: "Saraswat Co-operative Bank" },
  { code: "SCBL", name: "Standard Chartered Bank" },
  { code: "SBIN", name: "State Bank of India" },
  { code: "SHBK", name: "Shinhan Bank" },
  { code: "SIBL", name: "South Indian Bank" },
  { code: "SKSB", name: "Shikshak Sahakari Bank" },
  { code: "SMCB", name: "Shivalik Small Finance Bank" },
  { code: "SOGE", name: "Societe Generale" },
  { code: "STCB", name: "SBM Bank India" },
  { code: "SURY", name: "Suryoday Small Finance Bank" },
  { code: "SVCB", name: "Shamrao Vithal Co-operative Bank" },
  { code: "TBSB", name: "Thane Bharat Sahakari Bank" },
  { code: "TDCB", name: "Thane District Central Co-operative Bank" },
  { code: "TGMB", name: "Tumkur Grain Merchants Co-operative Bank" },
  { code: "TJSB", name: "TJSB Sahakari Bank" },
  { code: "TMBL", name: "Tamilnad Mercantile Bank" },
  { code: "TNSC", name: "Tamil Nadu State Apex Co-operative Bank" },
  { code: "UBIN", name: "Union Bank of India" },
  { code: "UBSW", name: "UBS AG" },
  { code: "UCBA", name: "UCO Bank" },
  { code: "UJVN", name: "Ujjivan Small Finance Bank" },
  { code: "UNBA", name: "Unity Small Finance Bank" },
  { code: "UTKS", name: "Utkarsh Small Finance Bank" },
  { code: "VSBL", name: "Vishweshwar Sahakari Bank" },
  { code: "VVSB", name: "Vasai Vikas Sahakari Bank" },
  { code: "WBSC", name: "West Bengal State Co-operative Bank" },
  { code: "YESB", name: "Yes Bank" },
  { code: "ZCBL", name: "Zoroastrian Co-operative Bank" },
];

export const UNIQUE_INDIAN_BANKS: IndianBank[] = Array.from(
  new Map(RAW_INDIAN_BANKS.map((bank) => [bank.name, bank])).values()
).sort((a, b) => a.name.localeCompare(b.name));

/** IFSC prefix → local SVG slug under /public/indian-bank */
const LOCAL_BANK_SLUG_BY_IFSC: Record<string, string> = Object.fromEntries(
  LOCAL_INDIAN_BANKS.filter((bank) => bank.ifscPrefix).map((bank) => [
    bank.ifscPrefix!.toUpperCase(),
    bank.slug,
  ])
);

/**
 * Prefer local SVG from /public/indian-bank when available,
 * otherwise fall back to Razorpay CDN (BankSelect onError → initials).
 */
export function getBankLogoUrl(code: string, bankName?: string): string {
  const normalizedCode = code.trim().toUpperCase();
  const slugFromCode = LOCAL_BANK_SLUG_BY_IFSC[normalizedCode];
  if (slugFromCode) {
    return getLocalBankLogoPath(slugFromCode);
  }

  if (bankName) {
    const local = findLocalBankByName(bankName);
    if (local) return getLocalBankLogoPath(local.slug);
  }

  return `https://cdn.razorpay.com/static/assets/bank/${normalizedCode}.png`;
}

export function findIndianBankByName(name: string): IndianBank | undefined {
  const normalized = name.trim().toLowerCase();
  return UNIQUE_INDIAN_BANKS.find(
    (bank) => bank.name.toLowerCase() === normalized
  );
}

export function searchIndianBanks(query: string): IndianBank[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return UNIQUE_INDIAN_BANKS;
  return UNIQUE_INDIAN_BANKS.filter(
    (bank) =>
      bank.name.toLowerCase().includes(normalized) ||
      bank.code.toLowerCase().includes(normalized)
  );
}
