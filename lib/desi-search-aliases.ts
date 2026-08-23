/**
 * Deterministic desi synonym pack for Browse search.
 * Communities and languages are keywords, not hate filters.
 * City values are canonical names stored / shown on profiles.
 */

export const CITY_ALIASES: Record<string, string> = {
  hyd: "Hyderabad",
  hyderabad: "Hyderabad",
  hydrabad: "Hyderabad",
  hyderbad: "Hyderabad",
  "twin cities": "Hyderabad",
  "twin city": "Hyderabad",
  secunderabad: "Secunderabad",
  secbad: "Secunderabad",
  vizag: "Visakhapatnam",
  visakhapatnam: "Visakhapatnam",
  vizagapatnam: "Visakhapatnam",
  vskp: "Visakhapatnam",
  vijayawada: "Vijayawada",
  bezawada: "Vijayawada",
  blr: "Bengaluru",
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  blore: "Bengaluru",
  "b lore": "Bengaluru",
  chennai: "Chennai",
  madras: "Chennai",
  maa: "Chennai",
  mumbai: "Mumbai",
  bombay: "Mumbai",
  bom: "Mumbai",
  delhi: "Delhi",
  "new delhi": "Delhi",
  ncr: "Delhi",
  "ncr delhi": "Delhi",
  kolkata: "Kolkata",
  calcutta: "Kolkata",
  pune: "Pune",
  kochi: "Kochi",
  cochin: "Kochi",
  trivandrum: "Thiruvananthapuram",
  thiruvananthapuram: "Thiruvananthapuram",
  tvm: "Thiruvananthapuram",
  coimbatore: "Coimbatore",
  kovai: "Coimbatore",
  ahmedabad: "Ahmedabad",
  amdavad: "Ahmedabad",
  jaipur: "Jaipur",
  lucknow: "Lucknow",
  chandigarh: "Chandigarh",
  indore: "Indore",
  bhopal: "Bhopal",
  nagpur: "Nagpur",
  surat: "Surat",
  mysore: "Mysuru",
  mysuru: "Mysuru",
  goa: "Goa",
  "new york": "New York",
  "new york city": "New York",
  nyc: "New York",
  "new jersey": "New Jersey",
  jersey: "New Jersey",
  "jersey city": "Jersey City",
  nj: "New Jersey",
  "bay area": "Bay Area",
  "sf bay": "Bay Area",
  "sf bay area": "Bay Area",
};

export const SEARCH_CITIES = [
  "Hyderabad",
  "Secunderabad",
  "Vijayawada",
  "Guntur",
  "Warangal",
  "Karimnagar",
  "Nizamabad",
  "Rajahmundry",
  "Kakinada",
  "Tirupati",
  "Nellore",
  "Visakhapatnam",
  "Kurnool",
  "Anantapur",
  "Khammam",
  "Ongole",
  "Eluru",
  "Bhimavaram",
  "Machilipatnam",
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Chennai",
  "Pune",
  "Kolkata",
  "Kochi",
  "Thiruvananthapuram",
  "Coimbatore",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Chandigarh",
  "Indore",
  "Bhopal",
  "Nagpur",
  "Surat",
  "Mysuru",
  "Goa",
  "Dallas",
  "Austin",
  "Houston",
  "Atlanta",
  "Chicago",
  "Seattle",
  "San Jose",
  "Bay Area",
  "New Jersey",
  "New York",
  "Edison",
  "Irving",
  "Frisco",
  "Princeton",
  "Fremont",
  "Cupertino",
  "Sunnyvale",
  "Santa Clara",
  "Iselin",
  "Jersey City",
];

/** alias (normalized) → keyword stored for ILIKE / scoring */
export const KEYWORD_ALIASES: Record<string, string> = {
  telugu: "telugu",
  tamil: "tamil",
  hindi: "hindi",
  malayalam: "malayalam",
  kannada: "kannada",
  marathi: "marathi",
  gujarati: "gujarati",
  punjabi: "punjabi",
  bengali: "bengali",
  bangla: "bengali",
  urdu: "urdu",
  odia: "odia",
  oriya: "odia",
  tulu: "tulu",
  konkani: "konkani",
  iyengar: "iyengar",
  iyer: "iyer",
  reddy: "reddy",
  nair: "nair",
  nambiar: "nambiar",
  menon: "menon",
  naidu: "naidu",
  kamma: "kamma",
  kapu: "kapu",
  velama: "velama",
  raju: "raju",
  brahmin: "brahmin",
  namboodiri: "namboodiri",
  pillai: "pillai",
  chettiar: "chettiar",
  mudaliar: "mudaliar",
  gowda: "gowda",
  shetty: "shetty",
  patel: "patel",
  aggarwal: "aggarwal",
  agarwal: "aggarwal",
  kayastha: "kayastha",
  "syrian christian": "syrian christian",
  nri: "nri",
  "joint family": "joint family",
  "joint-family": "joint family",
  "nuclear family": "nuclear family",
  nuclear: "nuclear family",
  manglik: "manglik",
  mangalik: "manglik",
  "manglik dosh": "manglik",
  vegetarian: "vegetarian",
  veggie: "vegetarian",
  veg: "vegetarian",
  "pure veg": "vegetarian",
  pureveg: "vegetarian",
  eggetarian: "eggetarian",
  eggeterian: "eggetarian",
  eggitarian: "eggetarian",
  nonveg: "non-veg",
  "non-veg": "non-veg",
  "non veg": "non-veg",
  nonvegetarian: "non-veg",
  "non-vegetarian": "non-veg",
  "non vegetarian": "non-veg",
  vegan: "vegan",
  "dowry refuse": "no dowry",
  "no dowry": "no dowry",
  "dowry free": "no dowry",
  "against dowry": "no dowry",
  h1b: "h1b",
  "h-1b": "h1b",
  "h 1b": "h1b",
  "green card": "green card",
  greencard: "green card",
  gc: "green card",
  "gc holder": "green card",
  "us citizen": "citizen",
  citizen: "citizen",
  oci: "oci",
  pio: "pio",
  f1: "f1",
  "f-1": "f1",
  opt: "opt",
  "stem opt": "opt",
  l1: "l1",
  "l-1": "l1",
  h4: "h4",
  "h-4": "h4",
  ead: "ead",
  "indian citizen": "indian citizen",
  "indian passport": "indian citizen",
};

const CANONICAL_CITIES = new Set(
  Object.values(CITY_ALIASES)
    .map(function (name) {
      return name.toLowerCase();
    })
    .concat(
      SEARCH_CITIES.map(function (name) {
        return name.toLowerCase();
      })
    )
);

export function isKnownCityName(value: string) {
  const key = value.toLowerCase().trim();
  return !!CITY_ALIASES[key] || CANONICAL_CITIES.has(key);
}

export function isKnownKeywordAlias(value: string) {
  return !!KEYWORD_ALIASES[value.toLowerCase().trim()];
}

/** City column search terms: canonical name plus short aliases people type. */
export function cityMatchValues(city: string): string[] {
  const key = city.toLowerCase().trim();
  const canonical = CITY_ALIASES[key] || city.trim();
  const values: string[] = [];
  function add(value: string) {
    if (!value) return;
    const seen = values.some(function (item) {
      return item.toLowerCase() === value.toLowerCase();
    });
    if (!seen) values.push(value);
  }
  add(canonical);
  Object.keys(CITY_ALIASES).forEach(function (alias) {
    if (CITY_ALIASES[alias].toLowerCase() !== canonical.toLowerCase()) return;
    if (alias.includes(" ")) return;
    if (alias.length < 3) return;
    add(alias);
  });
  return values.slice(0, 8);
}
