import { AttributeDie, DifficultyDie } from "./terms.mjs";
import { TestDialog } from "../apps/test-dialog.mjs";
import { addPraga } from "../helpers/sockets.mjs";

const { OperatorTerm } = foundry.dice.terms;

/**
 * Teste em Pódio: a parada do jogador (2 dados de atributo) contra a parada de
 * dificuldade (1 a 3 dados da mesma face). Basta um dado do jogador alcançar o
 * MAIOR DD para o objetivo do teste ser bem-sucedido.
 *
 * O eixo narrativo é propriedade desta classe (nunca do template):
 * - successes / failures: dados que alcançam ou não o maior DD
 * - triz: exatamente um dado alcança (sucesso com consequência possível)
 * - dupla que alcança = crítico; dupla que não alcança = desastre
 *
 * O total da rolagem não significa nada neste sistema; o cartão de chat mostra
 * o pódio, não a soma.
 */
export class PodiumRoll extends foundry.dice.Roll {

  static TEST_CARD_TEMPLATE = "systems/sacrophagia/templates/chat/test-card.hbs";

  /* -------------------------------------------- */
  /*  Construção                                  */
  /* -------------------------------------------- */

  /** Monta a rolagem a partir do config do teste (faces vêm do ator, já com estados). */
  static fromConfig(config) {
    const attributes = config.actor.system.attributes;
    const terms = [
      new AttributeDie({
        number: 1,
        faces: attributes[config.primary].faces,
        options: { attribute: config.primary }
      }),
      new OperatorTerm({ operator: "+" }),
      new AttributeDie({
        number: 1,
        faces: attributes[config.secondary].faces,
        options: { attribute: config.secondary }
      }),
      new OperatorTerm({ operator: "+" }),
      new DifficultyDie({
        number: config.ddCount,
        faces: config.ddFaces,
        options: { difficulty: true }
      })
    ];
    return this.fromTerms(terms, {
      test: {
        primary: config.primary,
        secondary: config.secondary,
        ddFaces: config.ddFaces,
        ddCount: config.ddCount
      }
    });
  }

  /* -------------------------------------------- */
  /*  Eixo narrativo                              */
  /* -------------------------------------------- */

  /** Os dois dados da parada do jogador. */
  get playerDice() {
    return this.dice.filter(d => d instanceof AttributeDie);
  }

  /** A parada de dificuldade (um termo com 1 a 3 dados da mesma face). */
  get difficultyDie() {
    return this.dice.find(d => d instanceof DifficultyDie);
  }

  /** O maior DD do teste, alvo que os dados do jogador precisam alcançar. */
  get highestDifficulty() {
    return this.difficultyDie?.highest ?? null;
  }

  /** Quantos dados do jogador alcançam ou superam o maior DD (cada um = 1 Graça). */
  get successes() {
    if (!this._evaluated) return undefined;
    const dd = this.highestDifficulty;
    return this.playerDice.filter(d => d.total >= dd).length;
  }

  /** Quantos dados do jogador falham (cada um = 1 Praga para o mestre). */
  get failures() {
    if (!this._evaluated) return undefined;
    return this.playerDice.length - this.successes;
  }

  /** O objetivo principal do teste é alcançado com pelo menos um sucesso. */
  get isSuccess() {
    if (!this._evaluated) return undefined;
    return this.successes >= 1;
  }

  /** Sucesso Por Um Triz: exatamente um dado alcança o DD. */
  get isNarrow() {
    if (!this._evaluated) return undefined;
    return this.successes === 1;
  }

  /** Dupla: os dois dados do jogador mostram o mesmo número. */
  get isDouble() {
    if (!this._evaluated) return undefined;
    const [a, b] = this.playerDice;
    return !!a && !!b && a.total === b.total;
  }

  /** Crítico: dupla que alcança o DD (limpa 1 de Fome, 2 Graça habituais). */
  get isCritical() {
    if (!this._evaluated) return undefined;
    return this.isDouble && this.isSuccess;
  }

  /** Desastre: dupla que não alcança o DD (Praga grátis; DE não pode modificar). */
  get isDisaster() {
    if (!this._evaluated) return undefined;
    return this.isDouble && !this.isSuccess;
  }

  /** Chave do resultado: critico, sucesso, triz, falha ou desastre. */
  get outcome() {
    if (!this._evaluated) return undefined;
    if (this.isCritical) return "critico";
    if (this.isDisaster) return "desastre";
    if (this.successes === 2) return "sucesso";
    if (this.successes === 1) return "triz";
    return "falha";
  }

  /* -------------------------------------------- */
  /*  Pipeline                                    */
  /* -------------------------------------------- */

  /**
   * Caminho único de todo Teste em Pódio: hooks, diálogo de configuração,
   * avaliação, economia (sempre ANTES de qualquer modificação do resultado) e
   * cartão de chat.
   *
   * config = {
   *   actor, primary, secondary, ddFaces, ddCount,
   *   weaponUuid?, targetName?, event?, dialog?, skips?: { economia, message }
   * }
   */
  static async build(config = {}) {
    config.primary ??= "carne";
    config.secondary ??= config.primary;
    config.ddFaces ??= 6;
    config.ddCount ??= 1;

    if (Hooks.call("sacrophagia.preRollTest", config) === false) return null;

    // Shift pula o diálogo de configuração
    const skipDialog = config.dialog === false || config.event?.shiftKey;
    if (!skipDialog) {
      const confirmed = await TestDialog.configure(config);
      if (!confirmed) return null;
    }

    const roll = this.fromConfig(config);
    await roll.evaluate();

    if (Hooks.call("sacrophagia.postRollTest", roll, config) === false) return roll;

    // A distribuição de Graça e Praga acontece antes de qualquer modificação
    // do resultado (Soma e Gula nunca a alteram)
    const economy = await this.#applyEconomy(roll, config);

    if (!config.skips?.message) await this.#toChat(roll, config, economy);
    return roll;
  }

  /**
   * Economia do teste: cada sucesso concede 1 Graça ao jogador, cada falha
   * concede 1 Praga ao mestre; crítico limpa 1 de Fome. Apenas testes de
   * personagens do jogador alimentam a economia. Com a automação desligada, o
   * cartão apenas registra a distribuição para aplicação manual.
   */
  static async #applyEconomy(roll, config) {
    const actor = config.actor;
    const economy = { graca: 0, praga: 0, fome: 0, manual: false, pragaPendente: false };
    if (config.skips?.economia || actor?.type !== "character") return economy;

    economy.graca = roll.successes;
    economy.praga = roll.failures;
    if (roll.isCritical) economy.fome = -1;

    if (!game.settings.get("sacrophagia", "automacaoEconomia")) {
      economy.manual = true;
      return economy;
    }

    if (economy.graca) await actor.addGraca(economy.graca);
    if (economy.fome) await actor.addFome(economy.fome, { forcado: false });
    if (economy.praga) {
      // Sem GM conectado o delta não tem quem o aplique; o cartão avisa a mesa
      const aplicada = await addPraga(economy.praga);
      if (!aplicada) economy.pragaPendente = true;
    }
    return economy;
  }

  /* -------------------------------------------- */
  /*  Cartão de chat                              */
  /* -------------------------------------------- */

  /**
   * Renderiza o cartão do pódio a partir de dados serializáveis. Usado na
   * criação da mensagem e no re-render após a jogada Soma (quando o DE
   * converte uma falha em sucesso, o cartão precisa refletir o novo resultado
   * e destravar o botão de dano).
   *
   * data = {
   *   playerDice: [{ attribute, faces, total, success, somado }],
   *   difficulty: { die, count, highest, aptidao, results },
   *   outcomeKey, economy, targetName, arma, canSoma, somaValue
   * }
   */
  static async renderCard(data) {
    const attrsConfig = CONFIG.SACROPHAGIA.attributes;

    const playerDice = data.playerDice.map(d => ({
      ...d,
      shape: attrsConfig[d.attribute]?.shape ?? "circle",
      label: game.i18n.localize(attrsConfig[d.attribute]?.label ?? ""),
      die: `d${d.faces}`
    }));

    const notes = [];
    if (data.outcomeKey === "triz") notes.push(game.i18n.localize("SACROPHAGIA.Chat.TrizNote"));
    if (data.outcomeKey === "desastre") notes.push(game.i18n.localize("SACROPHAGIA.Chat.DesastreNote"));
    if (data.somaValue) notes.push(game.i18n.format("SACROPHAGIA.Chat.SomaNoCartao", { valor: data.somaValue }));
    if (data.economy?.pragaPendente) notes.push(game.i18n.localize("SACROPHAGIA.Chat.PragaPendente"));

    const context = {
      playerDice,
      difficulty: data.difficulty,
      outcome: {
        key: data.outcomeKey,
        label: game.i18n.localize(CONFIG.SACROPHAGIA.outcomes[data.outcomeKey] ?? "")
      },
      economy: {
        ...data.economy,
        show: !!(data.economy?.graca || data.economy?.praga || data.economy?.fome || data.economy?.manual)
      },
      notes,
      targetName: data.targetName || null,
      arma: data.arma ? {
        name: data.arma.name,
        dano: data.arma.system.dano,
        tipo: game.i18n.localize(CONFIG.SACROPHAGIA.damageTypes[data.arma.system.tipo] ?? "")
      } : null,
      canDamage: !!data.arma && ["critico", "sucesso", "triz"].includes(data.outcomeKey),
      canSoma: data.canSoma
    };
    context.hasButtons = context.canSoma || context.canDamage;

    return foundry.applications.handlebars.renderTemplate(this.TEST_CARD_TEMPLATE, context);
  }

  /** Contexto serializável da parada de dificuldade, a partir da rolagem. */
  static difficultyContext(roll) {
    const ddDie = roll?.difficultyDie;
    if (!ddDie) return { die: "", count: "", highest: 0, aptidao: "", results: [] };
    const highest = ddDie.highest;
    return {
      die: `d${ddDie.faces}`,
      count: ddDie.number,
      highest,
      aptidao: game.i18n.localize(CONFIG.SACROPHAGIA.difficulty[ddDie.faces] ?? ""),
      results: ddDie.results.map(r => ({ result: r.result, highest: r.result === highest }))
    };
  }

  /** Renderiza o cartão e cria a mensagem tipada com o snapshot do teste. */
  static async #toChat(roll, config, economy) {
    const actor = config.actor;
    const dd = roll.highestDifficulty;
    const arma = config.weaponUuid ? await fromUuid(config.weaponUuid) : null;
    const de = actor?.system.extraordinario;
    const outcomeKey = roll.outcome;

    const playerDice = roll.playerDice.map(die => ({
      attribute: die.attribute,
      faces: die.faces,
      total: die.total,
      success: die.total >= dd,
      somado: false
    }));

    const content = await this.renderCard({
      playerDice,
      difficulty: this.difficultyContext(roll),
      outcomeKey,
      economy,
      targetName: config.targetName ?? null,
      arma,
      // Soma modifica um dado do teste com o DE; desastre não pode ser modificado
      canSoma: !!de?.faces && outcomeKey !== "desastre"
    });

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
      rolls: [roll],
      sound: CONFIG.sounds.dice,
      type: "teste",
      system: {
        actorUuid: actor?.uuid ?? "",
        weaponUuid: config.weaponUuid ?? "",
        targetName: config.targetName ?? "",
        outcome: outcomeKey,
        successes: roll.successes,
        highest: dd,
        playerDice: playerDice.map(d => ({ attribute: d.attribute, faces: d.faces, total: d.total })),
        economy
      }
    });
  }
}
