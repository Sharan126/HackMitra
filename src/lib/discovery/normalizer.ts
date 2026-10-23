import { KARNATAKA_DISTRICTS, District, AdministrativeDivision, KDEMCluster } from "@/lib/karnataka-data";

/**
 * Normalization result for a Karnataka geographic query
 */
export interface NormalizedLocation {
  isKarnataka: boolean;
  districtId: string | null;
  districtName: string | null;
  kannadaDistrict: string | null;
  division: AdministrativeDivision | null;
  cluster: KDEMCluster | null;
  isBeyondBengaluru: boolean;
  confidence: number;
}

/**
 * City / Taluk / College keywords mapped to district IDs
 */
const GEOGRAPHIC_MAPPINGS: Record<string, string[]> = {
  // Belagavi Division
  "bagalkot": ["bagalkot", "bagalkote", "badami", "jamkhandi", "ilkal", "mudhol", "bilagi", "basaveshwar", "bec bagalkot"],
  "belagavi": ["belgaum", "belagavi", "gokak", "chikkodi", "bailhongal", "athani", "khanapur", "saundatti", "ramdurg", "hukkeri", "kls git", "git belagavi", "msscet", "vtu belagavi", "vtu main campus"],
  "dharwad": ["dharwad", "hubli", "hubballi", "navanagar", "kalghatgi", "kundgol", "alnavar", "kle tech", "bvb college", "sdmcet", "iiit dharwad", "kud", "karnataka university"],
  "gadag": ["gadag", "betageri", "betgeri", "shirahatti", "ron taluk", "mundargi", "nargund", "gajendragad", "tontadarya"],
  "haveri": ["haveri", "ranebennur", "byadgi", "shiggaon", "hangal", "hirekerur", "savanur"],
  "uttara-kannada": ["karwar", "ankola", "kumta", "honnavar", "bhatkal", "sirsi", "dandeli", "yellapur", "haliyal", "joida", "siddapur", "rnset bhatkal"],
  "vijayapura": ["bijapur", "vijayapura", "basavana bagewadi", "sindagi", "indi taluk", "muddebihal", "talikoti", "chadchan", "bldea", "secab"],

  // Kalaburagi Division
  "ballari": ["bellary", "ballari", "sandur", "siruguppa", "kurugodu", "kampli", "bitm ballari", "rymec"],
  "bidar": ["bidar", "basavakalyan", "humnabad", "bhalki", "aurad", "kamalnagar", "gndec bidar", "bkit bhalki"],
  "kalaburagi": ["gulbarga", "kalaburagi", "aland", "sedam", "afzalpur", "chittapur", "chincholi", "jewargi", "pda college", "pda kalaburagi", "central university of karnataka", "cuk"],
  "koppal": ["koppal", "gangavathi", "kushtagi", "yelburga", "kanakagiri", "karatagi"],
  "raichur": ["raichur", "manvi", "sindhanur", "devadurga", "lingasugur", "maski", "sirwar", "iiit raichur", "navodaya"],
  "vijayanagara": ["hosapete", "hospet", "hampi", "harapanahalli", "kudligi", "hagari bommanahalli", "kotturu", "hoovina hadagali", "pdit hosapete"],
  "yadgir": ["yadgir", "shahapur", "shorapur", "surpur", "hunasagi", "wadagera", "gurmitkal"],

  // Mysuru Division
  "chamarajanagar": ["chamarajanagar", "chamarajanagara", "gundlupet", "kollegal", "hanur", "yelandur"],
  "chikkamagaluru": ["chikmagalur", "chikkamagaluru", "mudigere", "kadur", "tarikere", "koppal taluk", "sringeri", "narasimharajapura", "ajit"],
  "dakshina-kannada": ["mangalore", "mangaluru", "surathkal", "bantwal", "puttur", "belthangady", "sullia", "moodabidri", "moodbidri", "nitk", "nitk surathkal", "sahyadri", "canara", "st joseph engg", "sjec"],
  "hassan": ["hassan", "channarayapatna", "holenarasipura", "arsikere", "sakleshpur", "belur", "arkalgud", "aluru", "mce hassan"],
  "kodagu": ["madikeri", "coorg", "kodagu", "kushalnagar", "virajpet", "somwarpet", "ponnampet"],
  "mandya": ["mandya", "maddur", "srirangapatna", "pandavapura", "malavalli", "nagamangala", "kr pet", "pesce mandya"],
  "mysuru": ["mysore", "mysuru", "nanjangud", "hunsur", "periyapatna", "t narasipura", "heggadadevankote", "saragur", "nie mysuru", "sjce", "jss stu", "vvce", "mysore university"],
  "udupi": ["udupi", "manipal", "karkala", "kundapura", "kundapur", "byndoor", "kaup", "brahmavara", "hebri", "nitte", "nmamit", "mit manipal", "manipal academy"],

  // Bengaluru Division
  "bengaluru-rural": ["doddaballapura", "doddaballapur", "devanahalli", "hoskote", "nelamangala", "gitam bengaluru", "bengaluru rural"],
  "bengaluru-urban": [
    "bangalore", "bengaluru", "bengaluru urban", "whitefield", "electronic city", "koramangala", "indiranagar",
    "jayanagar", "hsr layout", "marathahalli", "yelahanka", "hebbal", "kengeri", "rajarajeshwari", "malleshwaram",
    "rajajinagar", "soladevanahalli", "peenya", "yeshwanthpur", "bmsce", "bmsit", "rvce", "pes university",
    "pesu", "msrit", "ramaiah", "iiit bangalore", "iiitb", "dayananda sagar", "dsce", "new horizon", "cmrit",
    "acharya", "acharya institute", "oxford college", "sir mvith", "bengaluru north"
  ],
  "chikkaballapura": ["chikkaballapur", "chikkaballapura", "gauribidanur", "bagepalli", "sidlaghatta", "chintamani", "gudibande", "sjcit"],
  "chitradurga": ["chitradurga", "challakere", "hiriyur", "holalkere", "hosadurga", "molakalmuru", "sjmit"],
  "davanagere": ["davangere", "davanagere", "harihar", "channagiri", "honnali", "jagalur", "nyamathi", "biet", "ubdtce", "gmit davanagere"],
  "kolar": ["kolar", "bangarapet", "malur", "srinivaspur", "mulbagal", "robertsonpet", "kgf", "kolar gold fields"],
  "ramanagara": ["ramanagara", "ramanagar", "channapatna", "magadi", "kanakapura", "harohalli", "bidadi", "dsu innovation campus", "dsu ramanagara"],
  "shivamogga": ["shimoga", "shivamogga", "bhadravati", "sagar", "shikaripura", "soraba", "thirthahalli", "hosanagara", "jnnce", "pesitm"],
  "tumakuru": ["tumkur", "tumakuru", "tiptur", "sira", "gubbi", "kunigal", "koratagere", "madhugiri", "pavagada", "turuvekere", "sit tumkur", "ssit"]
};

/**
 * Normalizes text to identify Karnataka district attribution
 */
export function normalizeKarnatakaLocation(
  city?: string | null,
  state?: string | null,
  locationText?: string | null,
  venueOrCollege?: string | null
): NormalizedLocation {
  const combined = [city || "", state || "", locationText || "", venueOrCollege || ""]
    .join(" ")
    .toLowerCase();

  // If explicit state is provided and is NOT Karnataka, verify with caution
  const stateLower = (state || "").toLowerCase().trim();
  const isExplicitNonKarnataka =
    stateLower !== "" &&
    stateLower !== "karnataka" &&
    stateLower !== "ka" &&
    !combined.includes("karnataka");

  // Check against our comprehensive geographic lookup
  for (const [districtId, keywords] of Object.entries(GEOGRAPHIC_MAPPINGS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "i");
      if (regex.test(combined)) {
        const district = KARNATAKA_DISTRICTS.find((d) => d.id === districtId);
        if (district) {
          // If explicit non-Karnataka state was tagged (e.g. Tamil Nadu or Maharashtra) but keyword matched,
          // only accept if "karnataka" is also explicitly in the location text
          if (isExplicitNonKarnataka && !combined.includes("karnataka")) {
            continue;
          }

          return {
            isKarnataka: true,
            districtId: district.id,
            districtName: district.name,
            kannadaDistrict: district.kannadaName,
            division: district.division,
            cluster: district.cluster,
            isBeyondBengaluru: district.id !== "bengaluru-urban",
            confidence: 0.95,
          };
        }
      }
    }
  }

  // If "karnataka" is explicitly present but no district was specifically matched
  if (combined.includes("karnataka") || stateLower === "karnataka") {
    // Default fallback to Bengaluru Urban if city contains bangalore, else unknown
    const defaultDistrict = KARNATAKA_DISTRICTS.find((d) => d.id === "bengaluru-urban")!;
    return {
      isKarnataka: true,
      districtId: defaultDistrict.id,
      districtName: defaultDistrict.name,
      kannadaDistrict: defaultDistrict.kannadaName,
      division: defaultDistrict.division,
      cluster: defaultDistrict.cluster,
      isBeyondBengaluru: false,
      confidence: 0.60,
    };
  }

  return {
    isKarnataka: false,
    districtId: null,
    districtName: null,
    kannadaDistrict: null,
    division: null,
    cluster: null,
    isBeyondBengaluru: false,
    confidence: 0.0,
  };
}

/**
 * Canonical URL Normalizer
 * Strips tracking parameters, lowers domain, strips trailing slashes and anchors
 */
export function normalizeCanonicalUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    
    // Normalize protocol and hostname to lowercase
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();

    // Tracking query parameters to strip
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "fbclid",
      "gclid",
      "twclid",
      "msclkid",
      "_ga",
      "source",
    ];

    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    // Remove trailing slash from pathname if length > 1
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    // Strip hash fragment
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return rawUrl.trim().replace(/\/$/, "");
  }
}
