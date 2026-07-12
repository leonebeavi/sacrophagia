/** Comportamento comum dos itens; os dados vivem nos data models. */
export class SacrophagiaItem extends Item {

  /**
   * Usa o item a partir da ficha. Armas atacam: um Teste em Pódio contra a
   * Esquiva do alvo (parada de dificuldade de 2 dados de Nervo do defensor).
   * Os demais tipos publicam a descrição no chat.
   */
  async use(event) {
    if (!this.actor) return;

    if (this.type === "arma") {
      const alvo = game.user.targets.first()?.actor ?? null;
      const esquiva = alvo?.system.esquiva ?? null;
      return this.actor.rollTest({
        primary: this.system.atributo,
        ddFaces: esquiva?.faces ?? 6,
        ddCount: esquiva?.count ?? 2,
        weaponUuid: this.uuid,
        targetName: alvo?.name,
        event
      });
    }

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<h3>${this.name}</h3>${this.system.description ?? ""}`
    });
  }
}
