export const DOMINO_SKINS = {
  classic: { name: "Ivoire classique", description: "La tuile traditionnelle, chaude et lumineuse.", face: "#ffefd1", shade: "#d9c4a1", edge: "#c9bb9c", pip: "#26392e" },
  obsidian: { name: "Obsidienne dorée", description: "Noir profond, filets d’or et points champagne.", face: "#38303d", shade: "#19141c", edge: "#e4b866", pip: "#ffdd99" },
  jade: { name: "Jade impérial", description: "Laque émeraude et détails en or pâle.", face: "#246c57", shade: "#10342d", edge: "#adcf86", pip: "#fff2ad" },
  glacier: { name: "Bleu glacier", description: "Porcelaine glacée et points bleu nuit.", face: "#e5fbff", shade: "#9fd8f4", edge: "#5aa4d0", pip: "#194262" },
  ruby: { name: "Rubis noir", description: "Rouge grenat satiné et points ivoire.", face: "#9e3155", shade: "#450f26", edge: "#ee919c", pip: "#fff0eb" },
  nebula: { name: "Nébuleuse", description: "Violet cosmique, reflets lilas et points cyan.", face: "#59438e", shade: "#261b55", edge: "#bd9df5", pip: "#bff8ff" },
  porcelain: { name: "Porcelaine cobalt", description: "Blanc porcelaine, contours cobalt et points indigo.", face: "#ffffff", shade: "#b7c9f5", edge: "#5573d1", pip: "#1d347b" },
  copper: { name: "Cuivre forgé", description: "Cuivre patiné, liseré bronze et points crème.", face: "#8a4d3b", shade: "#46271e", edge: "#dc9865", pip: "#fff2db" },
  aurora: { name: "Aurore polaire", description: "Turquoise givré et points prune sur un dégradé pastel.", face: "#b5f9e2", shade: "#a5b5f6", edge: "#6ec5d0", pip: "#2b2154" },
  dragon: { name: "Dragon de braise", description: "Un dragon sculpté jaillit dans une gerbe de braises.", face: "#782335", shade: "#300c1c", edge: "#f5a557", pip: "#fff1b5" },
  thunder: { name: "Foudre bleue", description: "Des éclairs gravés et une décharge au contact.", face: "#123371", shade: "#121c45", edge: "#61cfff", pip: "#e9fbff" },
  lotus: { name: "Lotus de jade", description: "Un lotus gravé libère des pétales lumineux.", face: "#115951", shade: "#09352d", edge: "#8de2bc", pip: "#fff0b9" },
  lunar: { name: "Lune d’argent", description: "Un croissant et ses étoiles laissent une traînée lunaire.", face: "#292d53", shade: "#161a30", edge: "#aabaf7", pip: "#f6efff" },
  shark: { name: "Requin des abysses", description: "Un requin stylisé fend la tuile et soulève des vagues.", face: "#12455f", shade: "#112a48", edge: "#68ddf8", pip: "#dcfaff" },
  scarab: { name: "Scarabée solaire", description: "Un scarabée ailé déclenche un éclat solaire.", face: "#563a20", shade: "#311c14", edge: "#f6b453", pip: "#fff6d4" },
  sakura: { name: "Sakura", description: "Des fleurs de cerisier et une pluie de pétales roses.", face: "#ffeeec", shade: "#eeb4cc", edge: "#bd4075", pip: "#651a49" },
  wolf: { name: "Loup des neiges", description: "Un loup gravé jaillit dans une pluie de cristaux.", face: "#dbeffd", shade: "#a4c0db", edge: "#466e9a", pip: "#172e52" },
  phoenix: { name: "Phénix écarlate", description: "Un phénix déploie ses ailes dans une gerbe de feu.", face: "#913b21", shade: "#4a1520", edge: "#ffc168", pip: "#fff4ce" },
  cobra: { name: "Cobra néon", description: "Un cobra lové traverse des anneaux vert néon.", face: "#233a32", shade: "#101e1c", edge: "#a8f666", pip: "#e7ffd1" },
} as const;
export type DominoSkin = keyof typeof DOMINO_SKINS;
export function isDominoSkin(value: unknown): value is DominoSkin {
  return typeof value === "string" && Object.hasOwn(DOMINO_SKINS, value);
}

export const BOARD_SKINS = {
  boardclassic: { name: "Feutre classique", description: "Feutre vert et bordure sombre.", felt: "#102f27", rail: "#365b4c", border: "#b38d55", accent: "#ddba70" },
  boardroyal: { name: "Salon royal", description: "Feutre bleu nuit et bordure en or patiné.", felt: "#18294b", rail: "#52456d", border: "#d4b779", accent: "#efd392" },
  boardember: { name: "Braises", description: "Feutre grenat, bois sombre et reflets cuivrés.", felt: "#451e27", rail: "#724337", border: "#c8825e", accent: "#ffbb88" },
  boardlagoon: { name: "Lagon", description: "Feutre bleu pétrole et bordure turquoise.", felt: "#123f49", rail: "#29656c", border: "#5ba9a9", accent: "#a6eee2" },
  boardnocturne: { name: "Nocturne", description: "Feutre violet profond et bordure lilas.", felt: "#30203e", rail: "#54416b", border: "#976ccc", accent: "#d9b8ff" },
  boardvolcano: { name: "Volcan de braise", description: "Cratère, coulées de lave et bordure de roche.", felt: "#351625", rail: "#59302c", border: "#c97543", accent: "#ffac61" },
  boardstorm: { name: "Cité d’orage", description: "Ville de nuit sous des éclairs bleus.", felt: "#141f40", rail: "#2a3e6b", border: "#5698d9", accent: "#8de2ff" },
  boardzen: { name: "Jardin de lotus", description: "Lotus et contours inspirés des jardins d’eau.", felt: "#153c37", rail: "#325744", border: "#80a370", accent: "#c8eb9b" },
  boardmoon: { name: "Observatoire lunaire", description: "Lune, constellations et anneaux d’observation.", felt: "#1a2141", rail: "#3b3b66", border: "#9271bc", accent: "#cec9ff" },
  boardreef: { name: "Récif des abysses", description: "Coraux, poissons et courants marins.", felt: "#132f48", rail: "#184b60", border: "#4a9fac", accent: "#96efe6" },
} as const;

export type BoardSkin = keyof typeof BOARD_SKINS;
export type SkinId = DominoSkin | BoardSkin;

export function isBoardSkin(value: unknown): value is BoardSkin {
  return typeof value === "string" && Object.hasOwn(BOARD_SKINS, value);
}

export function isSkinId(value: unknown): value is SkinId {
  return isDominoSkin(value) || isBoardSkin(value);
}
