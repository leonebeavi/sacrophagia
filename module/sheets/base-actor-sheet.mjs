import { onEditImage } from "../helpers/sheet-helpers.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Ficha base dos atores. Header fixo com os quatro atributos e abas de itens
 * e notas; as fichas específicas só ajustam classes e dimensões.
 */
export class SacrophagiaActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["sacrophagia", "sheet", "actor", "themed", "theme-dark"],
    position: { width: 620, height: 600 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      editImage: onEditImage,
      rollAttribute: SacrophagiaActorSheet.#onRollAttribute,
      createItem: SacrophagiaActorSheet.#onCreateItem,
      editItem: SacrophagiaActorSheet.#onEditItem,
      deleteItem: SacrophagiaActorSheet.#onDeleteItem
    }
  };

  static PARTS = {
    header: { template: "systems/sacrophagia/templates/actor/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    items: { template: "systems/sacrophagia/templates/actor/items.hbs", scrollable: [""] },
    notes: { template: "systems/sacrophagia/templates/actor/notes.hbs", scrollable: [""] }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "items", icon: "fa-solid fa-box-open" },
        { id: "notes", icon: "fa-solid fa-feather" }
      ],
      initial: "items",
      labelPrefix: "SACROPHAGIA.Tabs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    return {
      ...context,
      actor: this.document,
      system: this.document.system,
      fields: this.document.system.schema.fields,
      isEditable: this.isEditable,
      attributes: Object.entries(CONFIG.SACROPHAGIA.attributes).map(([key, config]) => ({
        key,
        shape: config.shape,
        label: game.i18n.localize(config.label),
        value: this.document.system.attributes[key]?.value ?? 0
      })),
      items: [...this.document.items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
      enrichedBiography: await TextEditor.enrichHTML(this.document.system.biography, {
        relativeTo: this.document,
        rollData: this.document.getRollData()
      }),
      config: CONFIG.SACROPHAGIA
    };
  }

  /** @override Entrega a cada PART de aba o seu registro em context.tabs. */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (partId in (context.tabs ?? {})) context.tab = context.tabs[partId];
    return context;
  }

  static async #onRollAttribute(event, target) {
    const key = target.closest("[data-attribute]")?.dataset.attribute;
    if (key) await this.document.rollAttribute(key);
  }

  static async #onCreateItem(event, target) {
    if (!this.isEditable) return;
    await Item.create(
      { name: game.i18n.localize("SACROPHAGIA.Items.New"), type: target.dataset.type ?? "item" },
      { parent: this.document }
    );
  }

  static #onEditItem(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    this.document.items.get(itemId)?.sheet.render(true);
  }

  static async #onDeleteItem(event, target) {
    if (!this.isEditable) return;
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    await this.document.items.get(itemId)?.delete();
  }
}
