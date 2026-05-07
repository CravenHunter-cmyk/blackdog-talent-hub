export type RecruitingLanguageOption = {
  label: string;
  value: string;
  language: string;
  region?: string;
  code: string;
};

function option(label: string, value: string, language: string, region?: string): Omit<RecruitingLanguageOption, "code"> {
  return { label, value, language, region };
}

const LANGUAGE_CODE_MAP: Record<string, string> = {
  english: "En",
  spanish: "Es",
  portuguese: "Pt",
  arabic: "Ar",
  chinese: "Zh",
  cantonese: "Yue",
  french: "Fr",
  german: "De",
  italian: "It",
  dutch: "Nl",
  swedish: "Sv",
  norwegian: "No",
  danish: "Da",
  finnish: "Fi",
  icelandic: "Is",
  greek: "El",
  hebrew: "He",
  czech: "Cs",
  slovak: "Sk",
  polish: "Pl",
  romanian: "Ro",
  bulgarian: "Bg",
  hungarian: "Hu",
  croatian: "Hr",
  serbian: "Sr",
  slovenian: "Sl",
  bosnian: "Bs",
  albanian: "Sq",
  macedonian: "Mk",
  ukrainian: "Uk",
  russian: "Ru",
  belarusian: "Be",
  lithuanian: "Lt",
  latvian: "Lv",
  estonian: "Et",
  irish: "Ga",
  welsh: "Cy",
  basque: "Eu",
  catalan: "Ca",
  galician: "Gl",
  maltese: "Mt",
  japanese: "Ja",
  korean: "Ko",
  thai: "Th",
  vietnamese: "Vi",
  indonesian: "Id",
  malay: "Ms",
  "filipino / tagalog": "Fil",
  cebuano: "Ceb",
  javanese: "Jv",
  sundanese: "Su",
  burmese: "My",
  khmer: "Km",
  lao: "Lo",
  mongolian: "Mn",
  kazakh: "Kk",
  uzbek: "Uz",
  kyrgyz: "Ky",
  tajik: "Tg",
  turkmen: "Tk",
  azerbaijani: "Az",
  georgian: "Ka",
  armenian: "Hy",
  hindi: "Hi",
  urdu: "Ur",
  bengali: "Bn",
  tamil: "Ta",
  telugu: "Te",
  marathi: "Mr",
  gujarati: "Gu",
  punjabi: "Pa",
  kannada: "Kn",
  malayalam: "Ml",
  sinhala: "Si",
  nepali: "Ne",
  pashto: "Ps",
  dari: "Fa",
  "persian / farsi": "Fa",
  afrikaans: "Af",
  swahili: "Sw",
  amharic: "Am",
  oromo: "Om",
  tigrinya: "Ti",
  somali: "So",
  hausa: "Ha",
  yoruba: "Yo",
  igbo: "Ig",
  zulu: "Zu",
  xhosa: "Xh",
  sesotho: "St",
  setswana: "Ts",
  kinyarwanda: "Rw",
  luganda: "Lg",
  shona: "Sn",
  ndebele: "Nd",
  malagasy: "Mg",
  wolof: "Wo",
  turkish: "Tr",
  kurdish: "Ku",
};

function getLanguageCode(language = "") {
  const normalized = normalizeLanguageLookup(language)
  return LANGUAGE_CODE_MAP[normalized] || "Lg"
}

function withCodePrefix(option: Omit<RecruitingLanguageOption, "code">): RecruitingLanguageOption {
  const code = getLanguageCode(option.language)
  return {
    ...option,
    code,
    label: `${code} - ${option.label}`,
  }
}

const LANGUAGE_OPTION_ROWS: Array<Omit<RecruitingLanguageOption, "code">> = [
  // English
  option("English - UK", "english_uk", "English", "UK"),
  option("English - EU", "english_eu", "English", "EU"),
  option("English - North American", "english_north_american", "English", "North American"),
  option("English - US", "english_us", "English", "US"),
  option("English - Canada", "english_canada", "English", "Canada"),
  option("English - Australia", "english_australia", "English", "Australia"),
  option("English - New Zealand", "english_new_zealand", "English", "New Zealand"),
  option("English - India", "english_india", "English", "India"),
  option("English - Singapore", "english_singapore", "English", "Singapore"),
  option("English - Philippines", "english_philippines", "English", "Philippines"),
  option("English - South Africa", "english_south_africa", "English", "South Africa"),
  option("English - RoW", "english_row", "English", "RoW"),

  // Spanish
  option("Spanish - Mexico", "spanish_mexico", "Spanish", "Mexico"),
  option("Spanish - Spain", "spanish_spain", "Spanish", "Spain"),
  option("Spanish - LATAM", "spanish_latam", "Spanish", "LATAM"),
  option("Spanish - United States", "spanish_united_states", "Spanish", "United States"),
  option("Spanish - Argentina", "spanish_argentina", "Spanish", "Argentina"),
  option("Spanish - Chile", "spanish_chile", "Spanish", "Chile"),
  option("Spanish - Colombia", "spanish_colombia", "Spanish", "Colombia"),
  option("Spanish - Peru", "spanish_peru", "Spanish", "Peru"),
  option("Spanish - Venezuela", "spanish_venezuela", "Spanish", "Venezuela"),
  option("Spanish - RoW", "spanish_row", "Spanish", "RoW"),

  // Portuguese
  option("Portuguese - Brazil", "portuguese_brazil", "Portuguese", "Brazil"),
  option("Portuguese - Portugal", "portuguese_portugal", "Portuguese", "Portugal"),
  option("Portuguese - Angola", "portuguese_angola", "Portuguese", "Angola"),
  option("Portuguese - Mozambique", "portuguese_mozambique", "Portuguese", "Mozambique"),
  option("Portuguese - RoW", "portuguese_row", "Portuguese", "RoW"),

  // Arabic
  option("Arabic - MENA", "arabic_mena", "Arabic", "MENA"),
  option("Arabic - Middle East", "arabic_middle_east", "Arabic", "Middle East"),
  option("Arabic - Saudi Arabia", "arabic_saudi_arabia", "Arabic", "Saudi Arabia"),
  option("Arabic - Egypt", "arabic_egypt", "Arabic", "Egypt"),
  option("Arabic - UAE", "arabic_uae", "Arabic", "UAE"),
  option("Arabic - Morocco", "arabic_morocco", "Arabic", "Morocco"),
  option("Arabic - Algeria", "arabic_algeria", "Arabic", "Algeria"),
  option("Arabic - Tunisia", "arabic_tunisia", "Arabic", "Tunisia"),
  option("Arabic - Jordan", "arabic_jordan", "Arabic", "Jordan"),
  option("Arabic - Lebanon", "arabic_lebanon", "Arabic", "Lebanon"),
  option("Arabic - Iraq", "arabic_iraq", "Arabic", "Iraq"),
  option("Arabic - Qatar", "arabic_qatar", "Arabic", "Qatar"),
  option("Arabic - Kuwait", "arabic_kuwait", "Arabic", "Kuwait"),
  option("Arabic - South Africa", "arabic_south_africa", "Arabic", "South Africa"),
  option("Arabic - RoW", "arabic_row", "Arabic", "RoW"),

  // Chinese / Cantonese
  option("Chinese - Simplified", "chinese_simplified", "Chinese", "Simplified"),
  option("Chinese - Traditional", "chinese_traditional", "Chinese", "Traditional"),
  option("Chinese - Mainland China", "chinese_mainland_china", "Chinese", "Mainland China"),
  option("Chinese - Taiwan", "chinese_taiwan", "Chinese", "Taiwan"),
  option("Chinese - Hong Kong", "chinese_hong_kong", "Chinese", "Hong Kong"),
  option("Chinese - Singapore", "chinese_singapore", "Chinese", "Singapore"),
  option("Cantonese - Hong Kong", "cantonese_hong_kong", "Cantonese", "Hong Kong"),
  option("Cantonese - Guangdong", "cantonese_guangdong", "Cantonese", "Guangdong"),

  // Europe
  option("French - France", "french_france", "French", "France"),
  option("French - Canada", "french_canada", "French", "Canada"),
  option("French - Belgium", "french_belgium", "French", "Belgium"),
  option("French - Switzerland", "french_switzerland", "French", "Switzerland"),
  option("French - Africa", "french_africa", "French", "Africa"),
  option("French - RoW", "french_row", "French", "RoW"),
  option("German - Germany", "german_germany", "German", "Germany"),
  option("German - Austria", "german_austria", "German", "Austria"),
  option("German - Switzerland", "german_switzerland", "German", "Switzerland"),
  option("Italian - Italy", "italian_italy", "Italian", "Italy"),
  option("Dutch - Netherlands", "dutch_netherlands", "Dutch", "Netherlands"),
  option("Dutch - Belgium", "dutch_belgium", "Dutch", "Belgium"),
  option("Swedish - Sweden", "swedish_sweden", "Swedish", "Sweden"),
  option("Norwegian - Norway", "norwegian_norway", "Norwegian", "Norway"),
  option("Danish - Denmark", "danish_denmark", "Danish", "Denmark"),
  option("Finnish - Finland", "finnish_finland", "Finnish", "Finland"),
  option("Icelandic - Iceland", "icelandic_iceland", "Icelandic", "Iceland"),
  option("Greek - Greece", "greek_greece", "Greek", "Greece"),
  option("Hebrew - Israel", "hebrew_israel", "Hebrew", "Israel"),
  option("Czech - Czech Republic", "czech_czech_republic", "Czech", "Czech Republic"),
  option("Slovak - Slovakia", "slovak_slovakia", "Slovak", "Slovakia"),
  option("Polish - Poland", "polish_poland", "Polish", "Poland"),
  option("Romanian - Romania", "romanian_romania", "Romanian", "Romania"),
  option("Bulgarian - Bulgaria", "bulgarian_bulgaria", "Bulgarian", "Bulgaria"),
  option("Hungarian - Hungary", "hungarian_hungary", "Hungarian", "Hungary"),
  option("Croatian - Croatia", "croatian_croatia", "Croatian", "Croatia"),
  option("Serbian - Serbia", "serbian_serbia", "Serbian", "Serbia"),
  option("Slovenian - Slovenia", "slovenian_slovenia", "Slovenian", "Slovenia"),
  option("Bosnian - Bosnia and Herzegovina", "bosnian_bosnia_and_herzegovina", "Bosnian", "Bosnia and Herzegovina"),
  option("Albanian - Albania", "albanian_albania", "Albanian", "Albania"),
  option("Macedonian - North Macedonia", "macedonian_north_macedonia", "Macedonian", "North Macedonia"),
  option("Ukrainian - Ukraine", "ukrainian_ukraine", "Ukrainian", "Ukraine"),
  option("Russian - Russia", "russian_russia", "Russian", "Russia"),
  option("Russian - RoW", "russian_row", "Russian", "RoW"),
  option("Belarusian - Belarus", "belarusian_belarus", "Belarusian", "Belarus"),
  option("Lithuanian - Lithuania", "lithuanian_lithuania", "Lithuanian", "Lithuania"),
  option("Latvian - Latvia", "latvian_latvia", "Latvian", "Latvia"),
  option("Estonian - Estonia", "estonian_estonia", "Estonian", "Estonia"),
  option("Irish - Ireland", "irish_ireland", "Irish", "Ireland"),
  option("Welsh - Wales", "welsh_wales", "Welsh", "Wales"),
  option("Basque - Spain", "basque_spain", "Basque", "Spain"),
  option("Catalan - Catalonia Spain", "catalan_catalonia_spain", "Catalan", "Catalonia Spain"),
  option("Galician - Spain", "galician_spain", "Galician", "Spain"),
  option("Maltese - Malta", "maltese_malta", "Maltese", "Malta"),

  // Asia Pacific
  option("Japanese - Japan", "japanese_japan", "Japanese", "Japan"),
  option("Korean - South Korea", "korean_south_korea", "Korean", "South Korea"),
  option("Thai - Thailand", "thai_thailand", "Thai", "Thailand"),
  option("Vietnamese - Vietnam", "vietnamese_vietnam", "Vietnamese", "Vietnam"),
  option("Indonesian - Indonesia", "indonesian_indonesia", "Indonesian", "Indonesia"),
  option("Malay - Malaysia", "malay_malaysia", "Malay", "Malaysia"),
  option("Malay - Singapore", "malay_singapore", "Malay", "Singapore"),
  option("Filipino / Tagalog - Philippines", "filipino_tagalog_philippines", "Filipino / Tagalog", "Philippines"),
  option("Cebuano - Philippines", "cebuano_philippines", "Cebuano", "Philippines"),
  option("Javanese - Indonesia", "javanese_indonesia", "Javanese", "Indonesia"),
  option("Sundanese - Indonesia", "sundanese_indonesia", "Sundanese", "Indonesia"),
  option("Burmese - Myanmar", "burmese_myanmar", "Burmese", "Myanmar"),
  option("Khmer - Cambodia", "khmer_cambodia", "Khmer", "Cambodia"),
  option("Lao - Laos", "lao_laos", "Lao", "Laos"),
  option("Mongolian - Mongolia", "mongolian_mongolia", "Mongolian", "Mongolia"),
  option("Kazakh - Kazakhstan", "kazakh_kazakhstan", "Kazakh", "Kazakhstan"),
  option("Uzbek - Uzbekistan", "uzbek_uzbekistan", "Uzbek", "Uzbekistan"),
  option("Kyrgyz - Kyrgyzstan", "kyrgyz_kyrgyzstan", "Kyrgyz", "Kyrgyzstan"),
  option("Tajik - Tajikistan", "tajik_tajikistan", "Tajik", "Tajikistan"),
  option("Turkmen - Turkmenistan", "turkmen_turkmenistan", "Turkmen", "Turkmenistan"),
  option("Azerbaijani - Azerbaijan", "azerbaijani_azerbaijan", "Azerbaijani", "Azerbaijan"),
  option("Georgian - Georgia", "georgian_georgia", "Georgian", "Georgia"),
  option("Armenian - Armenia", "armenian_armenia", "Armenian", "Armenia"),

  // South Asia
  option("Hindi - India", "hindi_india", "Hindi", "India"),
  option("Urdu - Pakistan", "urdu_pakistan", "Urdu", "Pakistan"),
  option("Urdu - India", "urdu_india", "Urdu", "India"),
  option("Bengali - Bangladesh", "bengali_bangladesh", "Bengali", "Bangladesh"),
  option("Bengali - West Bengal India", "bengali_west_bengal_india", "Bengali", "West Bengal India"),
  option("Tamil - India", "tamil_india", "Tamil", "India"),
  option("Tamil - Sri Lanka", "tamil_sri_lanka", "Tamil", "Sri Lanka"),
  option("Telugu - India", "telugu_india", "Telugu", "India"),
  option("Marathi - India", "marathi_india", "Marathi", "India"),
  option("Gujarati - India", "gujarati_india", "Gujarati", "India"),
  option("Punjabi - India", "punjabi_india", "Punjabi", "India"),
  option("Punjabi - Pakistan", "punjabi_pakistan", "Punjabi", "Pakistan"),
  option("Kannada - India", "kannada_india", "Kannada", "India"),
  option("Malayalam - India", "malayalam_india", "Malayalam", "India"),
  option("Sinhala - Sri Lanka", "sinhala_sri_lanka", "Sinhala", "Sri Lanka"),
  option("Nepali - Nepal", "nepali_nepal", "Nepali", "Nepal"),
  option("Nepali - India", "nepali_india", "Nepali", "India"),
  option("Pashto - Afghanistan", "pashto_afghanistan", "Pashto", "Afghanistan"),
  option("Pashto - Pakistan", "pashto_pakistan", "Pashto", "Pakistan"),
  option("Dari - Afghanistan", "dari_afghanistan", "Dari", "Afghanistan"),
  option("Persian / Farsi - Iran", "persian_farsi_iran", "Persian / Farsi", "Iran"),

  // Africa
  option("Afrikaans - South Africa", "afrikaans_south_africa", "Afrikaans", "South Africa"),
  option("Afrikaans - RoW", "afrikaans_row", "Afrikaans", "RoW"),
  option("Swahili - Tanzania", "swahili_tanzania", "Swahili", "Tanzania"),
  option("Swahili - Kenya", "swahili_kenya", "Swahili", "Kenya"),
  option("Swahili - Africa", "swahili_africa", "Swahili", "Africa"),
  option("Amharic - Ethiopia", "amharic_ethiopia", "Amharic", "Ethiopia"),
  option("Oromo - Ethiopia", "oromo_ethiopia", "Oromo", "Ethiopia"),
  option("Tigrinya - Eritrea", "tigrinya_eritrea", "Tigrinya", "Eritrea"),
  option("Somali - Somalia", "somali_somalia", "Somali", "Somalia"),
  option("Hausa - Nigeria", "hausa_nigeria", "Hausa", "Nigeria"),
  option("Hausa - West Africa", "hausa_west_africa", "Hausa", "West Africa"),
  option("Yoruba - Nigeria", "yoruba_nigeria", "Yoruba", "Nigeria"),
  option("Igbo - Nigeria", "igbo_nigeria", "Igbo", "Nigeria"),
  option("Zulu - South Africa", "zulu_south_africa", "Zulu", "South Africa"),
  option("Xhosa - South Africa", "xhosa_south_africa", "Xhosa", "South Africa"),
  option("Sesotho - South Africa", "sesotho_south_africa", "Sesotho", "South Africa"),
  option("Setswana - Botswana", "setswana_botswana", "Setswana", "Botswana"),
  option("Kinyarwanda - Rwanda", "kinyarwanda_rwanda", "Kinyarwanda", "Rwanda"),
  option("Luganda - Uganda", "luganda_uganda", "Luganda", "Uganda"),
  option("Shona - Zimbabwe", "shona_zimbabwe", "Shona", "Zimbabwe"),
  option("Ndebele - Zimbabwe", "ndebele_zimbabwe", "Ndebele", "Zimbabwe"),
  option("Malagasy - Madagascar", "malagasy_madagascar", "Malagasy", "Madagascar"),
  option("Wolof - Senegal", "wolof_senegal", "Wolof", "Senegal"),

  // Other / regional
  option("Turkish - Turkey", "turkish_turkey", "Turkish", "Turkey"),
  option("Kurdish - Turkey", "kurdish_turkey", "Kurdish", "Turkey"),
  option("Kurdish - Iraq", "kurdish_iraq", "Kurdish", "Iraq"),
  option("Kurdish - Iran", "kurdish_iran", "Kurdish", "Iran"),
  option("Kurdish - Syria", "kurdish_syria", "Kurdish", "Syria"),
  option("Greek - Cyprus", "greek_cyprus", "Greek", "Cyprus"),
  option("Turkish - Cyprus", "turkish_cyprus", "Turkish", "Cyprus"),
];

// Shared recruiting locale inventory used by the recruiting task language picker.
export const RECRUITING_LANGUAGE_OPTIONS = LANGUAGE_OPTION_ROWS.map(withCodePrefix);

function legacyRecruitingLanguageLabel(option: RecruitingLanguageOption) {
  return option.label.replace(/^[A-Za-z]+ - /, "")
}

const LANGUAGE_ALIAS_MAP: Record<string, string> = {
  english: "English - RoW",
  spanish: "Spanish - RoW",
  portuguese: "Portuguese - RoW",
  arabic: "Arabic - RoW",
  chinese: "Chinese - Simplified",
  cantonese: "Cantonese - Hong Kong",
  french: "French - RoW",
  german: "German - Germany",
  italian: "Italian - Italy",
  dutch: "Dutch - Netherlands",
  swedish: "Swedish - Sweden",
  norwegian: "Norwegian - Norway",
  danish: "Danish - Denmark",
  finnish: "Finnish - Finland",
  icelandic: "Icelandic - Iceland",
  greek: "Greek - Greece",
  hebrew: "Hebrew - Israel",
  czech: "Czech - Czech Republic",
  slovak: "Slovak - Slovakia",
  polish: "Polish - Poland",
  romanian: "Romanian - Romania",
  bulgarian: "Bulgarian - Bulgaria",
  hungarian: "Hungarian - Hungary",
  croatian: "Croatian - Croatia",
  serbian: "Serbian - Serbia",
  slovenian: "Slovenian - Slovenia",
  bosnian: "Bosnian - Bosnia and Herzegovina",
  albanian: "Albanian - Albania",
  macedonian: "Macedonian - North Macedonia",
  ukrainian: "Ukrainian - Ukraine",
  russian: "Russian - Russia",
  belarusian: "Belarusian - Belarus",
  lithuanian: "Lithuanian - Lithuania",
  latvian: "Latvian - Latvia",
  estonian: "Estonian - Estonia",
  irish: "Irish - Ireland",
  welsh: "Welsh - Wales",
  basque: "Basque - Spain",
  catalan: "Catalan - Catalonia Spain",
  galician: "Galician - Spain",
  maltese: "Maltese - Malta",
  japanese: "Japanese - Japan",
  korean: "Korean - South Korea",
  thai: "Thai - Thailand",
  vietnamese: "Vietnamese - Vietnam",
  indonesian: "Indonesian - Indonesia",
  malay: "Malay - Malaysia",
  "filipino / tagalog": "Filipino / Tagalog - Philippines",
  cebuano: "Cebuano - Philippines",
  javanese: "Javanese - Indonesia",
  sundanese: "Sundanese - Indonesia",
  burmese: "Burmese - Myanmar",
  khmer: "Khmer - Cambodia",
  lao: "Lao - Laos",
  mongolian: "Mongolian - Mongolia",
  kazakh: "Kazakh - Kazakhstan",
  uzbek: "Uzbek - Uzbekistan",
  kyrgyz: "Kyrgyz - Kyrgyzstan",
  tajik: "Tajik - Tajikistan",
  turkmen: "Turkmen - Turkmenistan",
  azerbaijani: "Azerbaijani - Azerbaijan",
  georgian: "Georgian - Georgia",
  armenian: "Armenian - Armenia",
  hindi: "Hindi - India",
  urdu: "Urdu - Pakistan",
  bengali: "Bengali - Bangladesh",
  tamil: "Tamil - India",
  telugu: "Telugu - India",
  marathi: "Marathi - India",
  gujarati: "Gujarati - India",
  punjabi: "Punjabi - India",
  kannada: "Kannada - India",
  malayalam: "Malayalam - India",
  sinhala: "Sinhala - Sri Lanka",
  nepali: "Nepali - Nepal",
  pashto: "Pashto - Afghanistan",
  dari: "Dari - Afghanistan",
  "persian / farsi": "Persian / Farsi - Iran",
  afrikaans: "Afrikaans - South Africa",
  swahili: "Swahili - Tanzania",
  amharic: "Amharic - Ethiopia",
  oromo: "Oromo - Ethiopia",
  tigrinya: "Tigrinya - Eritrea",
  somali: "Somali - Somalia",
  hausa: "Hausa - Nigeria",
  yoruba: "Yoruba - Nigeria",
  igbo: "Igbo - Nigeria",
  zulu: "Zulu - South Africa",
  xhosa: "Xhosa - South Africa",
  sesotho: "Sesotho - South Africa",
  setswana: "Setswana - Botswana",
  kinyarwanda: "Kinyarwanda - Rwanda",
  luganda: "Luganda - Uganda",
  shona: "Shona - Zimbabwe",
  ndebele: "Ndebele - Zimbabwe",
  malagasy: "Malagasy - Madagascar",
  wolof: "Wolof - Senegal",
  turkish: "Turkish - Turkey",
  kurdish: "Kurdish - Turkey",
};

function normalizeLanguageLookup(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
}

function compactLanguageLookup(value = "") {
  return normalizeLanguageLookup(value).replace(/[^a-z0-9]+/g, "")
}

export function findRecruitingLanguageOption(value = "") {
  const normalized = normalizeLanguageLookup(value)
  const compact = compactLanguageLookup(value)
  if (!normalized && !compact) return null

  const exactMatch = RECRUITING_LANGUAGE_OPTIONS.find((option) => {
    const optionValues = [option.label, legacyRecruitingLanguageLabel(option), option.value, option.language, option.region || "", option.code]
    return optionValues.some((item) => normalizeLanguageLookup(item) === normalized || compactLanguageLookup(item) === compact)
  })
  if (exactMatch) return exactMatch

  const alias = LANGUAGE_ALIAS_MAP[normalized] || LANGUAGE_ALIAS_MAP[compact]
  if (alias) {
    const aliasMatch = RECRUITING_LANGUAGE_OPTIONS.find(
      (option) => option.label === alias || legacyRecruitingLanguageLabel(option) === alias,
    )
    if (aliasMatch) return aliasMatch
  }

  const broadMatch = RECRUITING_LANGUAGE_OPTIONS.find((option) => normalizeLanguageLookup(option.language) === normalized)
  if (broadMatch) return broadMatch

  return null
}

export function canonicalRecruitingLanguageLabel(value = "") {
  const option = findRecruitingLanguageOption(value)
  return option?.label || String(value || "").trim()
}

function scoreLanguageField(field = "", query = "") {
  const normalizedField = normalizeLanguageLookup(field)
  const compactField = compactLanguageLookup(field)
  const normalizedQuery = normalizeLanguageLookup(query)
  const compactQuery = compactLanguageLookup(query)

  if (!normalizedQuery && !compactQuery) return 0

  if (normalizedField === normalizedQuery || compactField === compactQuery) return 0
  if (normalizedField.startsWith(normalizedQuery) || compactField.startsWith(compactQuery)) return 1
  if (normalizedField.includes(normalizedQuery) || compactField.includes(compactQuery)) return 2

  return Number.POSITIVE_INFINITY
}

export function rankRecruitingLanguageOption(option: RecruitingLanguageOption, query = "") {
  const normalizedQuery = normalizeLanguageLookup(query)
  const compactQuery = compactLanguageLookup(query)
  if (!normalizedQuery && !compactQuery) return 0

  const codeScore = scoreLanguageField(option.code, query)
  if (codeScore !== Number.POSITIVE_INFINITY) return codeScore

  const languageScore = scoreLanguageField(option.language, query)
  if (languageScore !== Number.POSITIVE_INFINITY) return 2 + languageScore

  const regionScore = scoreLanguageField(option.region || "", query)
  if (regionScore !== Number.POSITIVE_INFINITY) return 5 + regionScore

  const labelScore = scoreLanguageField(option.label, query)
  if (labelScore !== Number.POSITIVE_INFINITY) return 8 + labelScore

  const valueScore = scoreLanguageField(option.value, query)
  if (valueScore !== Number.POSITIVE_INFINITY) return 9 + valueScore

  return Number.POSITIVE_INFINITY
}

export function recruitingLanguageOptionMatchesQuery(option: RecruitingLanguageOption, query = "") {
  return rankRecruitingLanguageOption(option, query) !== Number.POSITIVE_INFINITY
}
