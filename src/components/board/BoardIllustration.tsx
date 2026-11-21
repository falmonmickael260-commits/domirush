import { BOARD_ILLUSTRATIONS } from "@/lib/dominoIllustrations";
import { BOARD_SKINS, type BoardSkin } from "@/lib/dominoSkins";

export function BoardIllustration({ skin, className }: { skin: BoardSkin; className?: string }) {
  const strokes = BOARD_ILLUSTRATIONS[skin];
  if (!strokes) return null;
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className={className} data-board-illustration={skin}
      fill="none" stroke={BOARD_SKINS[skin].accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {strokes.map((stroke, index) => (
        <polyline key={index} points={stroke.map(point => point.join(",")).join(" ")} />
      ))}
    </svg>
  );
}
