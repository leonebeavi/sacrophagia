import { SacrophagiaActorBase } from "./base-actor-data.mjs";

/**
 * NPC / adversário. Vida, Fome e Graça são recursos de personagem do jogador;
 * NPCs usam apenas a base comum (atributos, DE, Vida, defesas e limiares).
 * Campos próprios de adversário (papel, jogadas de Praga) entram quando o
 * capítulo "Praga, Adversários e Desafios" for definido.
 */
export class NpcData extends SacrophagiaActorBase {

  static LOCALIZATION_PREFIXES = ["SACROPHAGIA.Actor.base", "SACROPHAGIA.Actor.npc"];
}
