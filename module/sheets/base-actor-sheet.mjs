import { onEditImage } from "../helpers/sheet-helpers.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Ficha base dos atores. Header com os quatro atributos (seletores de face) e
 * o dado extraordinário; barra de recursos e derivados de defesa; abas de
 * itens (agrupados por tipo), estados e notas.
 */
export class SacrophagiaActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["sacrophagia", "sheet", "actor", "themed", "theme-dark"],
    position: { width: 660, height: 700 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      editImage: onEditImage,
      rollTest: SacrophagiaActorSheet.#onRollTest,
      useItem: SacrophagiaActorSheet.#onUseItem,
      createItem: SacrophagiaActorSheet.#onCreateItem,
      editItem: SacrophagiaActorSheet.#onEditItem,
      deleteItem: SacrophagiaActorSheet.#onDeleteItem,
      toggleItemEquip: SacrophagiaActorSheet.#onToggleItemEquip,
      adjustResource: SacrophagiaActorSheet.#onAdjustResource,
      setGraca: SacrophagiaActorSheet.#onSetGraca,
      applyStatus: SacrophagiaActorSheet.#onApplyStatus,
      toggleEffect: SacrophagiaActorSheet.#onToggleEffect,
      editEffect: SacrophagiaActorSheet.#onEditEffect,
      deleteEffect: SacrophagiaActorSheet.#onDeleteEffect
    }
  };

  static PARTS = {
    header: { template: "systems/sacrophagia/templates/actor/header.hbs" },
    resources: { template: "systems/sacrophagia/templates/actor/resources.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    items: { template: "systems/sacrophagia/templates/actor/items.hbs", scrollable: [""] },
    effects: { template: "systems/sacrophagia/templates/actor/effects.hbs", scrollable: [""] },
    notes: { template: "systems/sacrophagia/templates/actor/notes.hbs", scrollable: [""] }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "items", icon: "fa-solid fa-box-open" },
        { id: "effects", icon: "fa-solid fa-hand-sparkles" },
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
    const system = this.document.system;
    const conf = CONFIG.SACROPHAGIA;

    // Atributos: seletor de passo (face base) + face efetiva quando um estado a altera
    const dieOptions = conf.dieSteps.map((faces, step) => ({ step, label: `d${faces}` }));
    const attributes = Object.entries(conf.attributes).map(([key, cfg]) => {
      const attribute = system.attributes[key];
      return {
        key,
        shape: cfg.shape,
        label: game.i18n.localize(cfg.label),
        die: attribute.die,
        modified: attribute.bonus !== 0,
        options: dieOptions.map(o => ({ ...o, selected: o.step === attribute.step }))
      };
    });

    // Tiers do dado extraordinário
    const tierOptions = Object.entries(conf.tiers).map(([tier, label]) => ({
      tier: Number(tier),
      label: game.i18n.localize(label),
      selected: Number(tier) === system.extraordinario.tier
    }));

    // Itens agrupados por tipo
    const grupos = { arma: [], armadura: [], capacidade: [], item: [] };
    for (const item of [...this.document.items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))) {
      (grupos[item.type] ?? grupos.item).push(this.#prepareItem(item));
    }
    const sections = ["arma", "armadura", "capacidade", "item"].map(type => ({
      type,
      label: game.i18n.localize(`SACROPHAGIA.Items.Sections.${type}`),
      items: grupos[type]
    }));

    // Estados e condições ativos
    const effects = [...this.document.effects].map(effect => ({
      id: effect.id,
      name: effect.name,
      img: effect.img,
      disabled: effect.disabled,
      kind: effect.flags?.sacrophagia?.kind ?? "efeito"
    }));

    // Opções do seletor de aplicação rápida de status
    const statusOptions = {
      estados: Object.keys(conf.estados).map(id => ({
        id, label: game.i18n.localize(`SACROPHAGIA.Estados.${id}`)
      })),
      condicoes: Object.keys(conf.condicoes).map(id => ({
        id, label: game.i18n.localize(`SACROPHAGIA.Condicoes.${id}`)
      }))
    };

    // Pips de Graça (personagens do jogador)
    const gracaPips = system.graca
      ? Array.fromRange(conf.gracaMax).map(i => ({ index: i, filled: i < system.graca.value }))
      : null;

    return {
      ...context,
      actor: this.document,
      system,
      fields: system.schema.fields,
      isEditable: this.isEditable,
      isCharacter: this.document.type === "character",
      attributes,
      tierOptions,
      de: system.extraordinario,
      sections,
      effects,
      statusOptions,
      gracaPips,
      enrichedBiography: await TextEditor.enrichHTML(system.biography, {
        relativeTo: this.document,
        rollData: this.document.getRollData()
      }),
      config: conf
    };
  }

  /** @override Entrega a cada PART de aba o seu registro em context.tabs. */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (partId in (context.tabs ?? {})) context.tab = context.tabs[partId];
    return context;
  }

  /** Linha de item para a lista, com o resumo mecânico por tipo. */
  #prepareItem(item) {
    const base = { id: item.id, name: item.name, img: item.img, type: item.type };
    const conf = CONFIG.SACROPHAGIA;
    switch (item.type) {
      case "arma": {
        const tipo = game.i18n.localize(conf.damageTypes[item.system.tipo] ?? "");
        const attr = game.i18n.localize(conf.attributes[item.system.atributo]?.label ?? "");
        return { ...base, meta: `+${item.system.dano} ${tipo} (${attr})`, usable: true };
      }
      case "armadura": {
        const extra = item.system.acumulavel ? "+" : "";
        return {
          ...base,
          meta: `CA ${extra}${item.system.ca}, ${item.system.marcados}/${item.system.ca}`,
          equipada: item.system.equipada,
          equipToggle: true
        };
      }
      case "capacidade":
        return { ...base, meta: game.i18n.localize(`SACROPHAGIA.Tiers.${item.system.tier}`), usable: true };
      default:
        return {
          ...base,
          meta: item.system.quantidade > 1 ? `x${item.system.quantidade}` : "",
          usable: true
        };
    }
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static async #onRollTest(event, target) {
    const key = target.closest("[data-attribute]")?.dataset.attribute;
    if (key) await this.document.rollTest({ primary: key, event });
  }

  static async #onUseItem(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    await this.document.items.get(itemId)?.use(event);
  }

  static async #onCreateItem(event, target) {
    if (!this.isEditable) return;
    const type = target.dataset.type ?? "item";
    await Item.create(
      { name: game.i18n.localize(`SACROPHAGIA.Items.NewNames.${type}`), type },
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

  static async #onToggleItemEquip(event, target) {
    if (!this.isEditable) return;
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (item?.type === "armadura") await item.update({ "system.equipada": !item.system.equipada });
  }

  static async #onAdjustResource(event, target) {
    if (!this.isEditable) return;
    const { resource, delta } = target.dataset;
    await this.document.adjustResource(resource, Number(delta));
  }

  /** Pips de Graça: clicar no pip N define o valor; clicar no valor atual reduz. */
  static async #onSetGraca(event, target) {
    if (!this.isEditable) return;
    const index = Number(target.dataset.index);
    const atual = this.document.system.graca?.value ?? 0;
    const novo = atual === index + 1 ? index : index + 1;
    await this.document.update({ "system.graca.value": novo });
  }

  static async #onApplyStatus(event, target) {
    if (!this.isEditable) return;
    const select = this.element.querySelector("[data-status-select]");
    const statusId = select?.value;
    if (statusId) await this.document.toggleStatusEffect(statusId);
  }

  static async #onToggleEffect(event, target) {
    const effectId = target.closest("[data-effect-id]")?.dataset.effectId;
    const effect = this.document.effects.get(effectId);
    if (effect) await effect.update({ disabled: !effect.disabled });
  }

  static #onEditEffect(event, target) {
    const effectId = target.closest("[data-effect-id]")?.dataset.effectId;
    this.document.effects.get(effectId)?.sheet.render(true);
  }

  static async #onDeleteEffect(event, target) {
    if (!this.isEditable) return;
    const effectId = target.closest("[data-effect-id]")?.dataset.effectId;
    await this.document.effects.get(effectId)?.delete();
  }
}
