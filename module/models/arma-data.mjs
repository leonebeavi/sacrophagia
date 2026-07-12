import { SacrophagiaItemBase } from "./item-data.mjs";
import { SACROPHAGIA } from "../config.mjs";

const { fields } = foundry.data;

/**
 * Arma. O dano de um ataque bem-sucedido é o maior dado do teste (os dois, num
 * crítico) somado ao dano fixo da arma. O atributo padrão define o primeiro
 * dado da parada de ataque (ajustável no diálogo de teste).
 */
export class ArmaData extends SacrophagiaItemBase {

  static LOCALIZATION_PREFIXES = ["SACROPHAGIA.Item.base", "SACROPHAGIA.Item.arma"];

  static defineSchema() {
    return {
      ...super.defineSchema(),
      dano: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1, nullable: false }),
      tipo: new fields.StringField({
        required: true, choices: SACROPHAGIA.damageTypes, initial: "contuso"
      }),
      // Subtipo do dano elemental (fogo, gelo...), livre enquanto a lista não é fechada
      elemento: new fields.StringField({ required: true, blank: true }),
      atributo: new fields.StringField({
        required: true,
        choices: Object.fromEntries(
          Object.entries(SACROPHAGIA.attributes).map(([key, attr]) => [key, attr.label])
        ),
        initial: "nervo"
      })
    };
  }
}
