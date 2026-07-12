import { SACROPHAGIA } from "../config.mjs";

const { DialogV2 } = foundry.applications.api;

/**
 * Diálogo de configuração de um Teste em Pódio: escolha dos dois dados de
 * atributo da parada do jogador, da face do dado de dificuldade (aptidão do
 * contratempo) e da quantidade de DD (condições da cena, 1 a 3 dados).
 */
export class TestDialog {

  static TEMPLATE = "systems/sacrophagia/templates/apps/test-dialog.hbs";

  /**
   * Edita o config do teste no lugar. Retorna false se o teste foi cancelado.
   * @param {object} config  O config do PodiumRoll.build em construção.
   */
  static async configure(config) {
    const attributes = config.actor.system.attributes;

    const attributeOptions = role => Object.entries(SACROPHAGIA.attributes).map(([key, attr]) => ({
      key,
      label: `${game.i18n.localize(attr.label)} (${attributes[key].die})`,
      selected: key === (role === "primary" ? config.primary : config.secondary)
    }));

    const context = {
      primary: attributeOptions("primary"),
      secondary: attributeOptions("secondary"),
      difficulties: SACROPHAGIA.dieSteps.map(faces => ({
        faces,
        label: `d${faces}: ${game.i18n.localize(SACROPHAGIA.difficulty[faces])}`,
        selected: faces === config.ddFaces
      })),
      counts: Array.fromRange(SACROPHAGIA.ddCount.max, SACROPHAGIA.ddCount.min).map(n => ({
        n,
        selected: n === config.ddCount
      })),
      targetName: config.targetName ?? null
    };

    const content = await foundry.applications.handlebars.renderTemplate(this.TEMPLATE, context);

    const result = await DialogV2.wait({
      window: { title: game.i18n.localize("SACROPHAGIA.Dialog.TestTitle") },
      classes: ["sacrophagia", "test-dialog", "themed", "theme-dark"],
      content,
      rejectClose: false,
      buttons: [
        {
          action: "roll",
          label: game.i18n.localize("SACROPHAGIA.Dialog.Roll"),
          icon: "fa-solid fa-dice",
          default: true,
          callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object
        },
        {
          action: "cancel",
          label: game.i18n.localize("SACROPHAGIA.Dialog.Cancel"),
          icon: "fa-solid fa-xmark"
        }
      ]
    });

    if (!result || result === "cancel") return false;

    config.primary = result.primary;
    config.secondary = result.secondary;
    config.ddFaces = Number(result.ddFaces);
    config.ddCount = Math.clamp(Number(result.ddCount), SACROPHAGIA.ddCount.min, SACROPHAGIA.ddCount.max);
    return true;
  }
}
