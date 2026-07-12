const { fields } = foundry.data;

/** Base comum dos itens: toda coisa possuível tem uma descrição em texto rico. */
export class SacrophagiaItemBase extends foundry.abstract.TypeDataModel {

  static LOCALIZATION_PREFIXES = ["SACROPHAGIA.Item.base"];

  static defineSchema() {
    return {
      description: new fields.HTMLField()
    };
  }
}

/** Item genérico: equipamento, bem material ou qualquer coisa sem regra própria. */
export class ItemData extends SacrophagiaItemBase {

  static LOCALIZATION_PREFIXES = ["SACROPHAGIA.Item.base", "SACROPHAGIA.Item.item"];

  static defineSchema() {
    return {
      ...super.defineSchema(),
      quantidade: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1, nullable: false })
    };
  }
}
