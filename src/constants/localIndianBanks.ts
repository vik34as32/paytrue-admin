/** Banks with SVG logos in /public/indian-bank */
export interface LocalIndianBank {
  slug: string;
  name: string;
  ifscPrefix?: string;
}

export const LOCAL_INDIAN_BANKS: LocalIndianBank[] = [
  { slug: "apb", name: "Airtel Payments Bank", ifscPrefix: "AIRP" },
  { slug: "ausfb", name: "AU Small Finance Bank", ifscPrefix: "AUBL" },
  { slug: "axis", name: "Axis Bank", ifscPrefix: "UTIB" },
  { slug: "bandhan", name: "Bandhan Bank", ifscPrefix: "BDBL" },
  { slug: "bob", name: "Bank of Baroda", ifscPrefix: "BARB" },
  { slug: "boi", name: "Bank of India", ifscPrefix: "BKID" },
  { slug: "bom", name: "Bank of Maharashtra", ifscPrefix: "MAHB" },
  { slug: "canara", name: "Canara Bank", ifscPrefix: "CNRB" },
  { slug: "cbi", name: "Central Bank of India", ifscPrefix: "CBIN" },
  { slug: "city", name: "City Union Bank", ifscPrefix: "CIUB" },
  { slug: "csb", name: "CSB Bank", ifscPrefix: "CSBK" },
  { slug: "dcb", name: "DCB Bank", ifscPrefix: "DCBL" },
  { slug: "dhanlaxmi", name: "Dhanlaxmi Bank", ifscPrefix: "DLXB" },
  { slug: "esaf", name: "ESAF Small Finance Bank", ifscPrefix: "ESAF" },
  { slug: "federal", name: "Federal Bank", ifscPrefix: "FDRL" },
  { slug: "fino", name: "Fino Payments Bank", ifscPrefix: "FINO" },
  { slug: "hdfc", name: "HDFC Bank", ifscPrefix: "HDFC" },
  { slug: "icici", name: "ICICI Bank", ifscPrefix: "ICIC" },
  { slug: "idbi", name: "IDBI Bank", ifscPrefix: "IBKL" },
  { slug: "idfc", name: "IDFC FIRST Bank", ifscPrefix: "IDFB" },
  { slug: "indian", name: "Indian Bank", ifscPrefix: "IDIB" },
  { slug: "indiapost", name: "India Post Payments Bank", ifscPrefix: "IPOS" },
  { slug: "indus", name: "IndusInd Bank", ifscPrefix: "INDB" },
  { slug: "iob", name: "Indian Overseas Bank", ifscPrefix: "IOBA" },
  { slug: "jio", name: "Jio Payments Bank", ifscPrefix: "JIOP" },
  { slug: "jnk", name: "Jammu & Kashmir Bank", ifscPrefix: "JAKA" },
  { slug: "karnataka", name: "Karnataka Bank", ifscPrefix: "KARB" },
  { slug: "kotak", name: "Kotak Mahindra Bank", ifscPrefix: "KKBK" },
  { slug: "kvb", name: "Karur Vysya Bank", ifscPrefix: "KVBL" },
  { slug: "ntb", name: "Nainital Bank", ifscPrefix: "NTBL" },
  { slug: "paytm", name: "Paytm Payments Bank", ifscPrefix: "PYTM" },
  { slug: "pnb", name: "Punjab National Bank", ifscPrefix: "PUNB" },
  { slug: "psb", name: "Punjab & Sind Bank", ifscPrefix: "PSIB" },
  { slug: "rbl", name: "RBL Bank", ifscPrefix: "RATN" },
  { slug: "sbi", name: "State Bank of India", ifscPrefix: "SBIN" },
  { slug: "sib", name: "South Indian Bank", ifscPrefix: "SIBL" },
  { slug: "tmb", name: "Tamilnad Mercantile Bank", ifscPrefix: "TMBL" },
  { slug: "ubi", name: "Union Bank of India", ifscPrefix: "UBIN" },
  { slug: "uco", name: "UCO Bank", ifscPrefix: "UCBA" },
  { slug: "ujjivan", name: "Ujjivan Small Finance Bank", ifscPrefix: "UJVN" },
  { slug: "yes", name: "Yes Bank", ifscPrefix: "YESB" },
];

export function getLocalBankLogoPath(slug: string): string {
  return `/indian-bank/${slug}.svg`;
}

/** Tolerant compare: ignores case, punctuation, spacing and Ltd/Limited suffixes. */
function normalizeBankName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function findLocalBankByName(name: string): LocalIndianBank | undefined {
  const normalized = normalizeBankName(name);
  if (!normalized) return undefined;
  return LOCAL_INDIAN_BANKS.find(
    (bank) => normalizeBankName(bank.name) === normalized
  );
}

export function searchLocalIndianBanks(query: string): LocalIndianBank[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return LOCAL_INDIAN_BANKS;
  return LOCAL_INDIAN_BANKS.filter(
    (bank) =>
      bank.name.toLowerCase().includes(normalized) ||
      bank.slug.includes(normalized)
  );
}
