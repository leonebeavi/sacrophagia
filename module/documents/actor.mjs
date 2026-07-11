import { SacrophagiaRoll } from "../dice/sacrophagia-roll.mjs";

/** Comportamento comum dos atores; os dados vivem nos data models. */
export class SacrophagiaActor extends Actor {

  /** Personagens nascem com token vinculado e visão habilitada. */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;
    if (this.type === "character") {
      this.updateSource({ prototypeToken: { actorLink: true, sight: { enabled: true } } });
    }
  }

  /**
   * Teste de atributo. A fórmula (1d20 + valor) é provisória e será trocada
   * quando a resolução definitiva do sistema for desenhada.
   * @param {string} key  Chave do atributo (carne, nervo, juizo ou alma).
   * @returns {Promise<SacrophagiaRoll>}
   */
  async rollAttribute(key) {
    const config = CONFIG.SACROPHAGIA.attributes[key];
    if (!config) throw new Error(`sacrophagia | Atributo desconhecido: ${key}`);
    const roll = new SacrophagiaRoll(`1d20 + @${key}`, this.getRollData(), { attribute: key });
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("SACROPHAGIA.Chat.AttributeTest", {
        attribute: game.i18n.localize(config.label)
      })
    });
    return roll;
  }
}
