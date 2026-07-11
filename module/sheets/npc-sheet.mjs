import { SacrophagiaActorSheet } from "./base-actor-sheet.mjs";

/** Ficha de NPC / adversário: mesma estrutura, janela mais compacta. */
export class NpcSheet extends SacrophagiaActorSheet {
  static DEFAULT_OPTIONS = {
    // classes não concatenam na herança do AppV2; a lista completa é redeclarada
    classes: ["sacrophagia", "sheet", "actor", "npc", "themed", "theme-dark"],
    position: { width: 560, height: 540 }
  };
}
