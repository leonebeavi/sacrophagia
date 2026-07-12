import { SacrophagiaActorBase } from "./base-actor-data.mjs";
import { SACROPHAGIA } from "../config.mjs";

const { fields } = foundry.data;

/**
 * Personagem do jogador. Além da base comum, carrega os recursos exclusivos de
 * PJ: Fome (trilha que marca), Graça (reserva que gasta, máximo 7) e Bens
 * (moeda de descanso; o máximo é editável enquanto a regra não é fechada).
 */
export class CharacterData extends SacrophagiaActorBase {

  static LOCALIZATION_PREFIXES = ["SACROPHAGIA.Actor.base", "SACROPHAGIA.Actor.character"];

  static defineSchema() {
    return {
      ...super.defineSchema(),
      fome: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0, nullable: false })
      }),
      graca: new fields.SchemaField({
        value: new fields.NumberField({
          required: true, integer: true, min: 0, max: SACROPHAGIA.gracaMax, initial: 2, nullable: false
        })
      }),
      bens: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 5, nullable: false }),
        max: new fields.NumberField({ required: true, integer: true, min: 0, initial: 5, nullable: false })
      })
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    // Fome máxima: metade do máximo de Juízo + metade do máximo de Alma.
    // Usa passos base: estados não alteram o valor máximo de Fome.
    this.fome.max = (this.attributes.juizo.baseFaces / 2) + (this.attributes.alma.baseFaces / 2);

    this.graca.max = SACROPHAGIA.gracaMax;

    // Clamps de exibição (nunca persistem)
    this.fome.value = Math.clamp(this.fome.value, 0, this.fome.max);
    this.graca.value = Math.clamp(this.graca.value, 0, this.graca.max);
    this.bens.value = Math.clamp(this.bens.value, 0, this.bens.max);
  }
}
