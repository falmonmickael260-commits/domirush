"use client";

import Link from "next/link";
import { DominoSVG } from "@/components/domino/DominoSVG";

const SECTIONS = [
  {
    title: "Le principe",
    body: "Domirush se joue avec un jeu de 28 dominos, du double-blanc (0-0) au double-six (6-6). Chaque domino porte deux valeurs, de 0 à 6. Le but : être le premier à poser tous ses dominos, ou à en avoir le moins possible si la partie se bloque.",
  },
  {
    title: "La distribution",
    body: "Chaque joueur reçoit 7 dominos. Les dominos restants forment la pioche : 14 en jeu à 2, 7 en jeu à 3, et aucun en jeu à 4 (les 28 dominos sont alors entièrement distribués).",
  },
  {
    title: "Qui commence ?",
    body: "Le joueur qui possède le plus gros double (idéalement le double-six) commence la manche. S'il n'y a aucun double en jeu, c'est le joueur avec le domino de plus forte valeur qui ouvre.",
  },
  {
    title: "Poser un domino",
    body: "À votre tour, posez un domino dont l'une des deux valeurs correspond à une extrémité de la chaîne déjà posée sur la table. Vous pouvez jouer à gauche ou à droite, selon vos dominos. L'interface vous montre toujours où vos dominos peuvent être joués.",
  },
  {
    title: "Piocher et passer",
    body: "Si aucun de vos dominos ne peut être joué, vous devez piocher dans la pioche jusqu'à trouver un coup jouable — ou jusqu'à ce qu'elle soit vide. Si la pioche est vide et que vous n'avez toujours aucun coup possible, vous passez votre tour.",
  },
  {
    title: "Fin de manche",
    body: "La manche se termine dès qu'un joueur pose son dernier domino : il remporte alors la somme des points restants dans les mains de tous les autres joueurs. Si plus personne ne peut jouer (partie bloquée), c'est le joueur ayant le moins de points en main qui remporte la manche, avec la somme des points des autres joueurs.",
  },
  {
    title: "Fin de partie",
    body: "Les points s'accumulent manche après manche. La partie se termine dès qu'un joueur atteint l'objectif choisi en début de partie : 50 ou 100 points. Le joueur avec le plus de points à ce moment-là remporte la victoire.",
  },
  {
    title: "Mode 50 / Mode 100",
    body: "Une partie rapide se joue en 50 points, une partie plus longue en 100 points. Le choix se fait à la création de la table, avant d'inviter vos amis.",
  },
];

export default function ReglesPage() {
  return (
    <div className="min-h-dvh bg-bg px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-block text-sm text-text-dim hover:text-text">
          ← Accueil
        </Link>

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex gap-2">
            <div className="h-16 w-8">
              <DominoSVG a={6} b={6} />
            </div>
            <div className="h-16 w-8">
              <DominoSVG a={4} b={2} />
            </div>
          </div>
          <h1 className="wordmark text-3xl font-extrabold">Règles du jeu</h1>
          <p className="mt-1 text-sm text-text-dim">Le domino classique, expliqué simplement.</p>
        </div>

        <div className="flex flex-col gap-4">
          {SECTIONS.map((s, i) => (
            <section key={s.title} className="rounded-3xl bg-bg-elevated p-5 shadow-md">
              <h2 className="mb-1.5 flex items-center gap-2 text-base font-bold text-text">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                  {i + 1}
                </span>
                {s.title}
              </h2>
              <p className="text-sm leading-relaxed text-text-dim">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-bg-elevated p-5 text-center shadow-md">
          <p className="mb-3 text-sm text-text-dim">Prêt à jouer ?</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/solo"
              className="rounded-2xl bg-gradient-to-b from-gold-bright to-gold px-6 py-3 text-sm font-bold text-ink"
            >
              Essayer en solo
            </Link>
            <Link
              href="/creer"
              className="rounded-2xl bg-bg-panel px-6 py-3 text-sm font-bold text-text"
            >
              Créer une partie
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
