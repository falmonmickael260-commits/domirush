const MESSAGES: Record<string, string> = {
  NOT_YOUR_TURN: "Ce n'est pas votre tour.",
  TILE_NOT_OWNED: "Vous n'avez pas ce domino.",
  ILLEGAL_MOVE: "Ce domino ne peut pas être joué ici.",
  MUST_PLAY: "Vous avez un coup possible, vous devez jouer.",
  MUST_DRAW: "Vous devez piocher avant de passer.",
  BONEYARD_EMPTY: "Il n'y a plus de dominos à piocher.",
  INVALID_PHASE: "Cette action n'est pas disponible pour le moment.",
  ROOM_NOT_FOUND: "Cette partie n'existe plus.",
  ROOM_FULL: "Cette table est déjà complète.",
  GAME_ALREADY_STARTED: "La partie a déjà commencé.",
  NOT_READY: "Il manque des joueurs pour démarrer.",
  NOT_HOST: "Seul le créateur de la table peut démarrer la partie.",
  CONNECTION_ERROR: "Une erreur de connexion est survenue.",
};

export function friendlyMessage(code: string | undefined, fallback?: string): string {
  if (code && MESSAGES[code]) return MESSAGES[code];
  return fallback && !/^[A-Z_]+$/.test(fallback) ? fallback : "Une erreur est survenue. Réessayez.";
}
