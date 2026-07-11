const { fields } = foundry.data;

/**
 * Item genérico. Serve de molde enquanto os tipos definitivos do sistema não
 * são definidos; tipos específicos devem nascer como novos data models.
 */
export class ItemData extends foundry.abstract.TypeDataModel {

  static LOCALIZATION_PREFIXES = ["SACROPHAGIA.Item.base"];

  static defineSchema() {
    return {
      description: new fields.HTMLField()
    };
  }
}
