/**
 * Rolagem do sistema. Não impõe fórmula (a resolução definitiva ainda não
 * existe); cuida apenas do cartão de chat temático quando a rolagem sabe de
 * qual atributo veio (options.attribute) e o conteúdo é público. Sem atributo
 * ou em rolagem privada/blind, delega ao cartão padrão do core, que mascara
 * fórmula, total e contexto.
 */
export class SacrophagiaRoll extends foundry.dice.Roll {

  /**
   * Template do cartão temático. Não sobrescrever CHAT_TEMPLATE: o fallback
   * super.render() resolve o template via this.constructor.CHAT_TEMPLATE, e
   * sombreá-lo faria toda rolagem comum do mundo usar o cartão de atributo.
   */
  static ATTRIBUTE_CHAT_TEMPLATE = "systems/sacrophagia/templates/chat/attribute-roll.hbs";

  /** @override */
  async render({ flavor, isPrivate = false, ...rest } = {}) {
    const key = this.options.attribute;
    const config = CONFIG.SACROPHAGIA?.attributes?.[key];
    if (!config || isPrivate) return super.render({ flavor, isPrivate, ...rest });
    if (!this._evaluated) await this.evaluate({ allowInteractive: !isPrivate });
    return foundry.applications.handlebars.renderTemplate(this.constructor.ATTRIBUTE_CHAT_TEMPLATE, {
      formula: this._formula,
      total: Math.round(this.total * 100) / 100,
      tooltip: await this.getTooltip(),
      attribute: {
        key,
        shape: config.shape,
        label: game.i18n.localize(config.label)
      }
    });
  }
}
