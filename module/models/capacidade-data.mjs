import { SacrophagiaItemBase } from "./item-data.mjs";

const { fields } = foundry.data;

/**
 * Capacidade de personagem. As capacidades são os tiers de jogo, representadas
 * pelo dado extraordinário: cada capacidade exige um tier mínimo (1 = D4 até
 * 5 = D12). O capítulo de capacidades está em desenvolvimento; este modelo é o
 * ponto de entrada para efeitos e ativações futuras.
 */
export class CapacidadeData extends SacrophagiaItemBase {

  static LOCALIZATION_PREFIXES = ["SACROPHAGIA.Item.base", "SACROPHAGIA.Item.capacidade"];

  static defineSchema() {
    return {
      ...super.defineSchema(),
      tier: new fields.NumberField({
        required: true, integer: true, min: 1, max: 5, initial: 1, nullable: false,
        choices: {
          1: "SACROPHAGIA.Tiers.1",
          2: "SACROPHAGIA.Tiers.2",
          3: "SACROPHAGIA.Tiers.3",
          4: "SACROPHAGIA.Tiers.4",
          5: "SACROPHAGIA.Tiers.5"
        }
      })
    };
  }
}
