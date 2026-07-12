import { PodiumRoll } from "../dice/podium-roll.mjs";
import { SACROPHAGIA } from "../config.mjs";

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
   * @override O core V14 NÃO delega getRollData ao data model (Actor#getRollData
   * retorna this.system direto); sem esta ponte, @nervo na iniciativa e os
   * atalhos de fórmula das fichas resolveriam para 0.
   */
  getRollData() {
    return this.system.getRollData?.() ?? { ...this.system };
  }

  /* -------------------------------------------- */
  /*  Testes                                      */
  /* -------------------------------------------- */

  /**
   * Teste em Pódio: 2 dados de atributo contra a parada de dificuldade.
   * O diálogo de configuração permite ajustar tudo; Shift pula o diálogo.
   */
  async rollTest({ primary = "carne", secondary, ddFaces = 6, ddCount = 1, weaponUuid = "", targetName, event } = {}) {
    return PodiumRoll.build({
      actor: this,
      primary,
      secondary: secondary ?? primary,
      ddFaces,
      ddCount,
      weaponUuid,
      targetName,
      event
    });
  }

  /* -------------------------------------------- */
  /*  Recursos                                    */
  /* -------------------------------------------- */

  /** Ajuste genérico de trilhas e reservas pela ficha. */
  async adjustResource(key, delta) {
    if (!delta) return;
    switch (key) {
      case "vida": return this.addVida(delta);
      case "fome": return this.addFome(delta, { forcado: false });
      case "graca": return this.addGraca(delta);
      case "bens": {
        const bens = this.system.bens;
        if (!bens) return;
        return this.update({ "system.bens.value": Math.clamp(bens.value + delta, 0, bens.max) });
      }
      case "armadura": return this.adjustArmorMarks(delta);
    }
  }

  /** Marca (delta positivo) ou limpa (negativo) a trilha de Vida. */
  async addVida(delta) {
    const vida = this.system.vida;
    return this.update({ "system.vida.value": Math.clamp(vida.value + delta, 0, vida.max) });
  }

  /**
   * Marca ou limpa Fome. Com a trilha completamente marcada, um evento que
   * OBRIGA a marcar Fome marca 1 de Vida no lugar (independente do número).
   */
  async addFome(delta, { forcado = true } = {}) {
    const fome = this.system.fome;
    if (!fome) return;
    if (delta > 0 && fome.value >= fome.max) {
      if (forcado) return this.addVida(1);
      return;
    }
    return this.update({ "system.fome.value": Math.clamp(fome.value + delta, 0, fome.max) });
  }

  /** Concede (ou remove) Graça, respeitando o teto de acúmulo. */
  async addGraca(delta) {
    const graca = this.system.graca;
    if (!graca) return;
    return this.update({ "system.graca.value": Math.clamp(graca.value + delta, 0, SACROPHAGIA.gracaMax) });
  }

  /** Gasta Graça se houver o suficiente; retorna false caso contrário. */
  async spendGraca(cost = 1) {
    const graca = this.system.graca;
    if (!graca || graca.value < cost) return false;
    await this.update({ "system.graca.value": graca.value - cost });
    return true;
  }

  /**
   * Marca (delta positivo) ou limpa (negativo) espaços de armadura,
   * distribuindo entre as armaduras equipadas.
   */
  async adjustArmorMarks(delta) {
    if (!delta) return;
    // Cap pelo derivado do ator: a trilha é a CA efetiva (maior não acumulável
    // + acumuláveis), menor que a soma das capacidades individuais quando há
    // mais de uma armadura não acumulável equipada
    const trilha = this.system.armadura;
    delta = delta > 0 ? Math.min(delta, trilha.livres) : -Math.min(-delta, trilha.marcados);
    if (!delta) return;
    const armaduras = this.items.filter(i => i.type === "armadura" && i.system.equipada);
    if (!armaduras.length) return;

    const updates = [];
    let restante = Math.abs(delta);
    // Marcar preenche na ordem; limpar esvazia na ordem inversa
    const fila = delta > 0 ? armaduras : [...armaduras].reverse();
    for (const armadura of fila) {
      if (!restante) break;
      const marcados = armadura.system.marcados;
      const mudanca = delta > 0
        ? Math.min(restante, armadura.system.ca - marcados)
        : Math.min(restante, marcados);
      if (!mudanca) continue;
      updates.push({ _id: armadura.id, "system.marcados": marcados + Math.sign(delta) * mudanca });
      restante -= mudanca;
    }
    if (updates.length) await this.updateEmbeddedDocuments("Item", updates);
  }

  /* -------------------------------------------- */
  /*  Dano e defesa                               */
  /* -------------------------------------------- */

  /**
   * Aplica dano por limiares: abaixo do Limiar da Pele marca 1 de Vida (Dano
   * Menor); alcançando a Pele, 2 (Maior); alcançando o Limiar da Carne, 3
   * (Severo). Antes de marcar, oferece o Bloqueio: cada espaço de armadura
   * marcado reduz o grau em um (reduzir Dano Menor anula o dano).
   *
   * @param {number} total  Dano recebido (maior dado do teste + dano fixo).
   * @param {string} tipo   Tipo do dano (cortante, perfurante, contuso, elemental).
   * @returns {Promise<number>}  Marcas de Vida efetivamente aplicadas.
   */
  async applyDamage(total, tipo) {
    const sys = this.system;
    let dano = total;
    let ajuste = null;

    if (sys.defesas.imunidades.has(tipo)) {
      dano = 0;
      ajuste = "imune";
    } else if (sys.defesas.resistencias.has(tipo)) {
      dano = Math.floor(dano / 2);
      ajuste = "resistente";
    } else if (sys.defesas.vulnerabilidades.has(tipo)) {
      dano = dano * 2;
      ajuste = "vulneravel";
    }

    let grau = 0;
    if (dano > 0) {
      grau = dano >= sys.limiares.carne ? 3 : dano >= sys.limiares.pele ? 2 : 1;
    }

    // Bloqueio: decisão do dono da armadura (aqui, de quem aplica o dano)
    let bloqueio = 0;
    if (grau > 0 && sys.armadura.livres > 0) {
      bloqueio = await this.#promptBloqueio(grau, sys.armadura.livres);
      if (bloqueio > 0) await this.adjustArmorMarks(bloqueio);
    }

    const marcas = Math.max(grau - bloqueio, 0);
    if (marcas > 0) await this.addVida(marcas);

    const partes = [];
    if (ajuste) partes.push(game.i18n.localize(`SACROPHAGIA.Chat.Ajuste.${ajuste}`));
    if (bloqueio > 0) partes.push(game.i18n.format("SACROPHAGIA.Chat.BloqueioNote", { n: bloqueio }));
    const grauLabel = grau > 0
      ? game.i18n.localize(SACROPHAGIA.degraus[grau])
      : game.i18n.localize("SACROPHAGIA.Chat.SemDano");

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<p>${game.i18n.format("SACROPHAGIA.Chat.DanoAplicado", {
        name: this.name,
        marcas,
        grau: grauLabel,
        detalhes: partes.length ? ` (${partes.join(", ")})` : ""
      })}</p>`
    });

    return marcas;
  }

  /** Pergunta quantos espaços de armadura marcar para reduzir o grau do dano. */
  async #promptBloqueio(grau, livres) {
    const max = Math.min(grau, livres);
    const options = Array.fromRange(max + 1)
      .map(n => `<option value="${n}">${n}</option>`)
      .join("");
    const content = `
      <p>${game.i18n.format("SACROPHAGIA.Dialog.BloqueioHint", { grau, livres })}</p>
      <div class="form-group">
        <label>${game.i18n.localize("SACROPHAGIA.Dialog.BloqueioLabel")}</label>
        <select name="bloqueio">${options}</select>
      </div>`;

    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize("SACROPHAGIA.Dialog.BloqueioTitle") },
      classes: ["sacrophagia", "themed", "theme-dark"],
      content,
      rejectClose: false,
      ok: {
        label: game.i18n.localize("SACROPHAGIA.Dialog.BloqueioOk"),
        callback: (event, button) => Number(button.form.elements.bloqueio.value)
      }
    });
    return result ?? 0;
  }
}
