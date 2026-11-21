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
} as const;

export type BoardSkin = keyof typeof BOARD_SKINS;
export type SkinId = DominoSkin | BoardSkin;

export function isBoardSkin(value: unknown): value is BoardSkin {
  return typeof value === "string" && Object.hasOwn(BOARD_SKINS, value);
}

export function isSkinId(value: unknown): value is SkinId {
  return isDominoSkin(value) || isBoardSkin(value);
}
