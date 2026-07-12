import { addPraga, getPraga } from "../helpers/sockets.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * Tracker da reserva de Praga do mestre, sempre visível para a mesa. Jogadores
 * veem o total; o GM ajusta com os botões. O valor vive num world setting e o
 * onChange dele redesenha este app em todos os clientes.
 */
export class PragaTracker extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: "praga-tracker",
    classes: ["sacrophagia", "praga-tracker", "themed", "theme-dark"],
    window: {
      title: "SACROPHAGIA.Praga.Title",
      icon: "fa-solid fa-skull",
      resizable: false,
      minimizable: false
    },
    position: { width: 200, height: "auto" },
    actions: {
      pragaMais: PragaTracker.#onMais,
      pragaMenos: PragaTracker.#onMenos
    }
  };

  static PARTS = {
    main: { template: "systems/sacrophagia/templates/apps/praga-tracker.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return { ...context, praga: getPraga(), isGM: game.user.isGM };
  }

  static async #onMais() {
    if (game.user.isGM) await addPraga(1);
  }

  static async #onMenos() {
    if (game.user.isGM) await addPraga(-1);
  }
}
