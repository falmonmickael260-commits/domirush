export const DOMINO_SKINS = {
  classic: { name: "Ivoire classique", description: "La tuile traditionnelle, chaude et lumineuse.", face: "#ffefd1", shade: "#d9c4a1", edge: "#c9bb9c", pip: "#26392e" },
  obsidian: { name: "Obsidienne dorée", description: "Noir profond, filets d’or et points champagne.", face: "#38303d", shade: "#19141c", edge: "#e4b866", pip: "#ffdd99" },
  jade: { name: "Jade impérial", description: "Laque émeraude et détails en or pâle.", face: "#246c57", shade: "#10342d", edge: "#adcf86", pip: "#fff2ad" },
  glacier: { name: "Bleu glacier", description: "Porcelaine glacée et points bleu nuit.", face: "#e5fbff", shade: "#9fd8f4", edge: "#5aa4d0", pip: "#194262" },
  ruby: { name: "Rubis noir", description: "Rouge grenat satiné et points ivoire.", face: "#9e3155", shade: "#450f26", edge: "#ee919c", pip: "#fff0eb" },
  nebula: { name: "Nébuleuse", description: "Violet cosmique, reflets lilas et points cyan.", face: "#59438e", shade: "#261b55", edge: "#bd9df5", pip: "#bff8ff" },
} as const;
export type DominoSkin = keyof typeof DOMINO_SKINS;
export function isDominoSkin(value: unknown): value is DominoSkin {
  return typeof value === "string" && Object.hasOwn(DOMINO_SKINS, value);
}
