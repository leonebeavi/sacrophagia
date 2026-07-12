import { SacrophagiaItemBase } from "./item-data.mjs";

const { fields } = foundry.data;

/**
 * Armadura: qualquer forma de proteção. A CA compõe os limiares de defesa e
 * define a quantidade de espaços de armadura para Bloqueio. CA acumulável
 * (sinal de + na regra) soma-se à maior CA; não acumuláveis não se somam.
 * Os espaços marcados vivem no próprio item.
 */
export class ArmaduraData extends SacrophagiaItemBase {

  static LOCALIZATION_PREFIXES = ["SACROPHAGIA.Item.base", "SACROPHAGIA.Item.armadura"];

  static defineSchema() {
    return {
      ...super.defineSchema(),
      ca: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1, nullable: false }),
      acumulavel: new fields.BooleanField({ initial: false }),
      marcados: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0, nullable: false }),
      equipada: new fields.BooleanField({ initial: true })
    };
  }

  prepareDerivedData() {
    // Marcas nunca excedem os espaços fornecidos pela própria armadura
    this.marcados = Math.clamp(this.marcados, 0, this.ca);
    this.livres = this.ca - this.marcados;
  }
}
