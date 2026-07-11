import { onEditImage } from "../helpers/sheet-helpers.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/** Ficha do item genérico: header com imagem e nome, descrição em texto rico. */
export class SacrophagiaItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["sacrophagia", "sheet", "item", "themed", "theme-dark"],
    position: { width: 460, height: 420 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: { editImage: onEditImage }
  };

  static PARTS = {
    header: { template: "systems/sacrophagia/templates/item/header.hbs" },
    description: { template: "systems/sacrophagia/templates/item/description.hbs", scrollable: [""] }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    return {
      ...context,
      item: this.document,
      system: this.document.system,
      fields: this.document.system.schema.fields,
      isEditable: this.isEditable,
      enrichedDescription: await TextEditor.enrichHTML(this.document.system.description, {
        relativeTo: this.document
      })
    };
  }
}
