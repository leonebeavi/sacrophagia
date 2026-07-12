import { onEditImage } from "../helpers/sheet-helpers.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * Ficha de item única para todos os tipos: header com imagem e nome, bloco de
 * detalhes que varia por tipo (arma, armadura, capacidade, genérico) e
 * descrição em texto rico.
 */
export class SacrophagiaItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["sacrophagia", "sheet", "item", "themed", "theme-dark"],
    position: { width: 480, height: 520 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: { editImage: onEditImage }
  };

  static PARTS = {
    header: { template: "systems/sacrophagia/templates/item/header.hbs" },
    details: { template: "systems/sacrophagia/templates/item/details.hbs" },
    description: { template: "systems/sacrophagia/templates/item/description.hbs", scrollable: [""] }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    const type = this.document.type;
    return {
      ...context,
      item: this.document,
      system: this.document.system,
      fields: this.document.system.schema.fields,
      isEditable: this.isEditable,
      isArma: type === "arma",
      isArmadura: type === "armadura",
      isCapacidade: type === "capacidade",
      isGenerico: type === "item",
      isElemental: type === "arma" && this.document.system.tipo === "elemental",
      enrichedDescription: await TextEditor.enrichHTML(this.document.system.description, {
        relativeTo: this.document
      })
    };
  }
}
