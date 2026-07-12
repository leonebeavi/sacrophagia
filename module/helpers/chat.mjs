import { ExtraordinaryDie } from "../dice/terms.mjs";
import { PodiumRoll } from "../dice/podium-roll.mjs";
import { addPraga, getPraga } from "./sockets.mjs";
import { SACROPHAGIA } from "../config.mjs";

const DAMAGE_TEMPLATE = "systems/sacrophagia/templates/chat/damage-card.hbs";
const SOMA_TEMPLATE = "systems/sacrophagia/templates/chat/soma-card.hbs";

/** Liga os botões dos cartões de teste e de dano. */
export function registerChatHooks() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    if (!["teste", "dano"].includes(message.type)) return;
    for (const el of html.querySelectorAll("[data-action]")) {
      el.addEventListener("click", event => onChatAction(event, message));
    }
  });
}

async function onChatAction(event, message) {
  event.preventDefault();
  const action = event.currentTarget.dataset.action;
  switch (action) {
    case "somarDE": return onSomarDE(message);
    case "rolarDano": return onRolarDano(message);
    case "gula": return onGula(message);
    case "aplicarDano": return onAplicarDano(message);
  }
}

/** Rola o dado extraordinário do ator e devolve o resultado (com DSN). */
async function rollExtraordinary(actor) {
  const de = actor.system.extraordinario;
  const roll = foundry.dice.Roll.fromTerms([
    new ExtraordinaryDie({ number: 1, faces: de.faces })
  ]);
  await roll.evaluate();
  return roll;
}

/**
 * Jogada Soma: lança o DE e soma a um dado do teste, modificando o resultado
 * prévio. A distribuição de Graça e Praga nunca muda (já aconteceu), mas o
 * OBJETIVO do teste muda: uma falha convertida vira Sucesso Por Um Triz e o
 * cartão é re-renderizado com o novo resultado (destravando o dano, se houver
 * arma). Um desastre não pode ser modificado. Custo: 1 Graça (PJ) ou 1 Praga
 * (Sanha, NPC).
 */
async function onSomarDE(message) {
  const sys = message.system;
  const actor = sys.actorUuid ? await fromUuid(sys.actorUuid) : null;
  if (!actor?.isOwner) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemPermissao"));
  // A Soma atualiza a mensagem; só autor ou GM podem, e o custo é cobrado depois deste guard
  if (!message.canUserModify(game.user, "update")) {
    return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemPermissao"));
  }
  if (sys.soma.aplicada) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SomaAplicada"));
  if (sys.outcome === "desastre") return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SomaDesastre"));

  const de = actor.system.extraordinario;
  if (!de.faces) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemDE"));

  // Custo da jogada, quando a automação está ligada
  if (game.settings.get("sacrophagia", "automacaoEconomia")) {
    if (actor.type === "character") {
      const pago = await actor.spendGraca(1);
      if (!pago) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemGraca"));
    } else {
      if (getPraga() < 1) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemPraga"));
      await addPraga(-1);
    }
  }

  // Alvo padrão: o maior dado que falhou; sem falhas, o maior dado do teste
  const indexed = sys.playerDice.map((d, i) => ({ ...d, i }));
  const failing = indexed.filter(d => d.total < sys.highest);
  const alvo = (failing.length ? failing : indexed).sort((a, b) => b.total - a.total)[0];

  const roll = await rollExtraordinary(actor);
  const soma = { aplicada: true, dieIndex: alvo.i, value: roll.total };

  // Totais modificados e novo resultado do OBJETIVO (a economia não muda)
  const totals = sys.playerDice.map((d, i) => d.total + (soma.dieIndex === i ? soma.value : 0));
  let outcome = sys.outcome;
  let successes = sys.successes;
  if (["falha", "triz"].includes(outcome)) {
    successes = totals.filter(t => t >= sys.highest).length;
    outcome = successes >= 2 ? "sucesso" : successes === 1 ? "triz" : outcome;
  }

  // Re-render do cartão com o resultado modificado
  const arma = sys.weaponUuid ? await fromUuid(sys.weaponUuid) : null;
  const content = await PodiumRoll.renderCard({
    playerDice: sys.playerDice.map((d, i) => ({
      attribute: d.attribute,
      faces: d.faces,
      total: totals[i],
      success: totals[i] >= sys.highest,
      somado: soma.dieIndex === i
    })),
    difficulty: PodiumRoll.difficultyContext(message.rolls[0]),
    outcomeKey: outcome,
    economy: { ...sys.economy },
    targetName: sys.targetName,
    arma,
    canSoma: false,
    somaValue: soma.value
  });

  await message.update({
    content,
    "system.outcome": outcome,
    "system.successes": successes,
    "system.soma": soma
  });

  const attrConfig = CONFIG.SACROPHAGIA.attributes[alvo.attribute];
  const somaContent = await foundry.applications.handlebars.renderTemplate(SOMA_TEMPLATE, {
    de: `d${de.faces}`,
    valor: roll.total,
    attribute: {
      key: alvo.attribute,
      shape: attrConfig?.shape ?? "circle",
      label: game.i18n.localize(attrConfig?.label ?? "")
    },
    antes: alvo.total,
    depois: alvo.total + roll.total,
    highest: sys.highest,
    sucesso: alvo.total + roll.total >= sys.highest
  });

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: somaContent,
    rolls: [roll],
    sound: CONFIG.sounds.dice
  });
}

/**
 * Dano de um ataque bem-sucedido: maior dado do teste (os dois, num crítico)
 * somado ao dano fixo da arma. A Soma aplicada conta no dado modificado.
 */
async function onRolarDano(message) {
  const sys = message.system;
  const actor = sys.actorUuid ? await fromUuid(sys.actorUuid) : null;
  const arma = sys.weaponUuid ? await fromUuid(sys.weaponUuid) : null;
  if (!actor?.isOwner) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemPermissao"));
  if (!arma) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemArma"));
  if (!["critico", "sucesso", "triz"].includes(sys.outcome)) {
    return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemSucesso"));
  }

  const totals = sys.playerDice.map((d, i) =>
    d.total + (sys.soma.aplicada && sys.soma.dieIndex === i ? sys.soma.value : 0)
  );
  const base = sys.outcome === "critico"
    ? totals.reduce((a, b) => a + b, 0)
    : Math.max(...totals);
  const total = base + arma.system.dano;

  return createDamageMessage({
    actor,
    arma,
    total,
    tipo: arma.system.tipo,
    critico: sys.outcome === "critico",
    gula: null
  });
}

/** Cria (ou recria, após a Gula) o cartão de dano tipado. */
async function createDamageMessage({ actor, arma, total, tipo, critico = false, gula = null, message = null }) {
  const context = {
    arma: arma ? { name: arma.name } : null,
    total,
    tipo: game.i18n.localize(SACROPHAGIA.damageTypes[tipo] ?? ""),
    critico,
    gula,
    canGula: !gula && !!actor?.system.extraordinario.faces
  };
  const content = await foundry.applications.handlebars.renderTemplate(DAMAGE_TEMPLATE, context);

  if (message) {
    return message.update({ content, "system.total": total, "system.gulaAplicada": true });
  }
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    type: "dano",
    system: {
      actorUuid: actor?.uuid ?? "",
      weaponUuid: arma?.uuid ?? "",
      total,
      tipo,
      critico,
      gulaAplicada: false
    }
  });
}

/**
 * Jogada de Fome, Gula: ao causar dano, o portador de um DE pode lançá-lo e
 * somar o resultado ao dano. PJs pagam marcando 1 de Fome; como a marcação é
 * voluntária, a trilha cheia BLOQUEIA a jogada (não converte em Vida).
 * Personagens do narrador pagam 1 Praga.
 */
async function onGula(message) {
  const sys = message.system;
  const actor = sys.actorUuid ? await fromUuid(sys.actorUuid) : null;
  const arma = sys.weaponUuid ? await fromUuid(sys.weaponUuid) : null;
  if (!actor?.isOwner) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemPermissao"));
  // A Gula atualiza a mensagem; só autor ou GM podem, e o custo é cobrado depois deste guard
  if (!message.canUserModify(game.user, "update")) {
    return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemPermissao"));
  }
  if (sys.gulaAplicada) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.GulaAplicada"));

  const de = actor.system.extraordinario;
  if (!de.faces) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemDE"));

  if (game.settings.get("sacrophagia", "automacaoEconomia")) {
    if (actor.type === "character") {
      const fome = actor.system.fome;
      if (fome.value >= fome.max) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.FomeCheia"));
      await actor.addFome(1, { forcado: false });
    } else {
      if (getPraga() < 1) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemPraga"));
      await addPraga(-1);
    }
  }

  const roll = await rollExtraordinary(actor);
  const total = sys.total + roll.total;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p>${game.i18n.format("SACROPHAGIA.Chat.GulaNote", { valor: roll.total, de: `d${de.faces}` })}</p>`,
    rolls: [roll],
    sound: CONFIG.sounds.dice
  });

  return createDamageMessage({
    actor,
    arma,
    total,
    tipo: sys.tipo,
    critico: sys.critico,
    gula: { valor: roll.total, de: `d${de.faces}` },
    message
  });
}

/** Aplica o dano do cartão aos tokens visados (ou selecionados). */
async function onAplicarDano(message) {
  const sys = message.system;
  const tokens = game.user.targets.size ? [...game.user.targets] : canvas.tokens.controlled;
  if (!tokens.length) return ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.SemAlvo"));

  for (const token of tokens) {
    const actor = token.actor;
    if (!actor) continue;
    if (!actor.isOwner) {
      ui.notifications.warn(game.i18n.format("SACROPHAGIA.Warn.SemPermissaoAlvo", { name: actor.name }));
      continue;
    }
    await actor.applyDamage(sys.total, sys.tipo);
  }
}
