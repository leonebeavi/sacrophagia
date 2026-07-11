import { SacrophagiaActorSheet } from "./base-actor-sheet.mjs";

/** Ficha de personagem de jogador. */
export class CharacterSheet extends SacrophagiaActorSheet {
  static DEFAULT_OPTIONS = {
    // classes não concatenam na herança do AppV2; a lista completa é redeclarada
    classes: ["sacrophagia", "sheet", "actor", "character", "themed", "theme-dark"]
  };
}
