export interface UserProfile {
  id: string;
  name: string;
  avatar_initials: string;
  handle: string;
  country_code: string; // ISO 3166-1
  country_name: string;
  currency: string; // ISO 4217
  currency_symbol: string;
  flag_emoji: string;
  proxy_type: string;
  proxy_value: string;
  ips_network: string;
  is_kyc_verified: boolean;
}

export const PRESET_P2P_PROFILES: UserProfile[] = [
  {
    id: "user_sg_01",
    name: "Mei Ling",
    avatar_initials: "ML",
    handle: "@meiling.sg",
    country_code: "SG",
    country_name: "Singapore",
    currency: "SGD",
    currency_symbol: "S$",
    flag_emoji: "🇸🇬",
    proxy_type: "MOBILE",
    proxy_value: "+65 9123 4567",
    ips_network: "PayNow / FAST",
    is_kyc_verified: true,
  },
  {
    id: "user_in_02",
    name: "Rahul Sharma",
    avatar_initials: "RS",
    handle: "@rahul.sharma",
    country_code: "IN",
    country_name: "India",
    currency: "INR",
    currency_symbol: "₹",
    flag_emoji: "🇮🇳",
    proxy_type: "VPA",
    proxy_value: "rahul@okhdfcbank",
    ips_network: "UPI Instant",
    is_kyc_verified: true,
  },
  {
    id: "user_ae_03",
    name: "Tariq Al-Mansoor",
    avatar_initials: "TM",
    handle: "@tariq.dubai",
    country_code: "AE",
    country_name: "United Arab Emirates",
    currency: "AED",
    currency_symbol: "AED",
    flag_emoji: "🇦🇪",
    proxy_type: "MOBILE",
    proxy_value: "+971 50 123 4567",
    ips_network: "Aani IPP",
    is_kyc_verified: true,
  },
  {
    id: "user_gb_04",
    name: "Oliver Smith",
    avatar_initials: "OS",
    handle: "@oliver.london",
    country_code: "GB",
    country_name: "United Kingdom",
    currency: "GBP",
    currency_symbol: "£",
    flag_emoji: "🇬🇧",
    proxy_type: "MOBILE",
    proxy_value: "+44 7911 123456",
    ips_network: "Faster Payments",
    is_kyc_verified: true,
  },
  {
    id: "user_jp_05",
    name: "Kenji Sato",
    avatar_initials: "KS",
    handle: "@kenji.tokyo",
    country_code: "JP",
    country_name: "Japan",
    currency: "JPY",
    currency_symbol: "¥",
    flag_emoji: "🇯🇵",
    proxy_type: "MOBILE",
    proxy_value: "+81 90 1234 5678",
    ips_network: "Zengin System",
    is_kyc_verified: true,
  },
  {
    id: "user_us_06",
    name: "Sarah Jenkins",
    avatar_initials: "SJ",
    handle: "@sarah.ny",
    country_code: "US",
    country_name: "United States",
    currency: "USD",
    currency_symbol: "$",
    flag_emoji: "🇺🇸",
    proxy_type: "EMAIL",
    proxy_value: "sarah.j@nexus.org",
    ips_network: "FedNow / RTP",
    is_kyc_verified: true,
  },
];
