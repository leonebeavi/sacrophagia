/**
 * Constantes do sistema Sacrophagia, expostas em CONFIG.SACROPHAGIA.
 *
 * A identidade do sistema é dupla:
 * - Quatro atributos (Carne, Nervo, Juízo e Alma), cada um com forma geométrica
 *   e cor de destaque fixas, usadas nas fichas, cartões de chat e demais UIs.
 * - Uma única escada de dados (D4 a D12) compartilhada por atributos, dados de
 *   dificuldade e dado extraordinário: evoluir é sempre subir de face.
 */

/** Escada de faces: passo 0 = d4, passo 1 = d6, ... passo 4 = d12. */
export const DIE_STEPS = [4, 6, 8, 10, 12];

/** Converte um passo na quantidade de faces, com clamp nas pontas da escada. */
export function stepToFaces(step) {
  return DIE_STEPS[Math.clamp(step, 0, DIE_STEPS.length - 1)];
}

/**
 * Estados nomeados comuns: modificam o passo (a face) dos atributos em um passo
 * para cima (+1) ou para baixo (-1). Simples afetam um atributo, compostos dois
 * e cabais todos. Viram Active Effects via buildStatusEffects().
 */
const ESTADOS = {
  forte:      { tipo: "simples",  passos: { carne: 1 } },
  rapido:     { tipo: "simples",  passos: { nervo: 1 } },
  lucido:     { tipo: "simples",  passos: { juizo: 1 } },
  resoluto:   { tipo: "simples",  passos: { alma: 1 } },
  fraco:      { tipo: "simples",  passos: { carne: -1 } },
  lento:      { tipo: "simples",  passos: { nervo: -1 } },
  atordoado:  { tipo: "simples",  passos: { juizo: -1 } },
  abalado:    { tipo: "simples",  passos: { alma: -1 } },
  revigorado: { tipo: "composto", passos: { carne: 1, nervo: 1 } },
  sereno:     { tipo: "composto", passos: { juizo: 1, alma: 1 } },
  fervoroso:  { tipo: "composto", passos: { carne: 1, alma: 1 } },
  afiado:     { tipo: "composto", passos: { nervo: 1, juizo: 1 } },
  exausto:    { tipo: "composto", passos: { carne: -1, nervo: -1 } },
  perturbado: { tipo: "composto", passos: { juizo: -1, alma: -1 } },
  enfermo:    { tipo: "composto", passos: { carne: -1, alma: -1 } },
  enfurecido: { tipo: "composto", passos: { nervo: -1, juizo: -1 } },
  exaltado:   { tipo: "cabal",    passos: { carne: 1, nervo: 1, juizo: 1, alma: 1 } },
  arrasado:   { tipo: "cabal",    passos: { carne: -1, nervo: -1, juizo: -1, alma: -1 } }
};

/**
 * Condições nomeadas comuns: modificam a QUANTIDADE de dados de uma parada,
 * nunca a face. São fatores ambientais ou circunstanciais que o mestre ajusta
 * no diálogo de teste; aqui servem de marcador visual no token e na ficha.
 */
const CONDICOES = {
  surpreso:   { img: "icons/svg/daze.svg" },
  flanqueado: { img: "icons/svg/target.svg" },
  oculto:     { img: "icons/svg/invisible.svg" },
  protegido:  { img: "icons/svg/shield.svg" },
  elevado:    { img: "icons/svg/wing.svg" },
  asCegas:    { img: "icons/svg/blind.svg" },
  instavel:   { img: "icons/svg/falling.svg" },
  preparado:  { img: "icons/svg/sun.svg" }
};

export const SACROPHAGIA = {
  dieSteps: DIE_STEPS,

  attributes: {
    carne: { label: "SACROPHAGIA.Attributes.carne", shape: "circle", color: "#bb2a45" },
    nervo: { label: "SACROPHAGIA.Attributes.nervo", shape: "triangle", color: "#f2ae2e" },
    juizo: { label: "SACROPHAGIA.Attributes.juizo", shape: "square", color: "#25adda" },
    alma: { label: "SACROPHAGIA.Attributes.alma", shape: "diamond", color: "#a369dd" }
  },

  /** Aptidão expressa por cada face de dado de dificuldade (DD). */
  difficulty: {
    4: "SACROPHAGIA.Difficulty.4",
    6: "SACROPHAGIA.Difficulty.6",
    8: "SACROPHAGIA.Difficulty.8",
    10: "SACROPHAGIA.Difficulty.10",
    12: "SACROPHAGIA.Difficulty.12"
  },

  /** A parada de dificuldade varia de 1 a 3 dados, sempre da mesma face. */
  ddCount: { min: 1, max: 3 },

  /** Máximo de Graça acumulável por um personagem do jogador. */
  gracaMax: 7,

  /**
   * Tiers de jogo: as capacidades de personagem são representadas pelo dado
   * extraordinário (DE). Tier 0 = sem DE; tiers 1 a 5 = D4 a D12.
   */
  tiers: {
    0: "SACROPHAGIA.Tiers.0",
    1: "SACROPHAGIA.Tiers.1",
    2: "SACROPHAGIA.Tiers.2",
    3: "SACROPHAGIA.Tiers.3",
    4: "SACROPHAGIA.Tiers.4",
    5: "SACROPHAGIA.Tiers.5"
  },

  damageTypes: {
    cortante: "SACROPHAGIA.Damage.cortante",
    perfurante: "SACROPHAGIA.Damage.perfurante",
    contuso: "SACROPHAGIA.Damage.contuso",
    elemental: "SACROPHAGIA.Damage.elemental"
  },

  /** Graus de dano por limiar: 1 marca (Menor), 2 (Maior), 3 (Severo). */
  degraus: {
    1: "SACROPHAGIA.Degraus.menor",
    2: "SACROPHAGIA.Degraus.maior",
    3: "SACROPHAGIA.Degraus.severo"
  },

  /** Resultados possíveis de um Teste em Pódio. */
  outcomes: {
    critico: "SACROPHAGIA.Outcomes.critico",
    sucesso: "SACROPHAGIA.Outcomes.sucesso",
    triz: "SACROPHAGIA.Outcomes.triz",
    falha: "SACROPHAGIA.Outcomes.falha",
    desastre: "SACROPHAGIA.Outcomes.desastre"
  },

  /** Durações possíveis de um estado (sem automação por enquanto). */
  duracoes: {
    efemero: "SACROPHAGIA.Duracoes.efemero",
    temporario: "SACROPHAGIA.Duracoes.temporario",
    persistente: "SACROPHAGIA.Duracoes.persistente",
    permanente: "SACROPHAGIA.Duracoes.permanente"
  },

  estados: ESTADOS,
  condicoes: CONDICOES
};

/**
 * Monta a lista de status effects do sistema (substitui a lista padrão do
 * core). Estados carregam changes que somam ao bonus de passo dos atributos;
 * condições são marcadores sem automação, resolvidas no diálogo de teste.
 */
export function buildStatusEffects() {
  const effects = [
    // Mantém o status de morte do core (usado como overlay de derrota)
    { id: "dead", name: "EFFECT.StatusDead", img: "icons/svg/skull.svg" }
  ];

  const icones = {
    simples: { bencao: "icons/svg/upgrade.svg", maldicao: "icons/svg/downgrade.svg" },
    composto: { bencao: "icons/svg/upgrade.svg", maldicao: "icons/svg/downgrade.svg" },
    cabal: { bencao: "icons/svg/regen.svg", maldicao: "icons/svg/degen.svg" }
  };

  for (const [id, estado] of Object.entries(ESTADOS)) {
    const polaridade = Object.values(estado.passos).every(v => v > 0) ? "bencao" : "maldicao";
    effects.push({
      id,
      name: `SACROPHAGIA.Estados.${id}`,
      img: icones[estado.tipo][polaridade],
      changes: Object.entries(estado.passos).map(([attr, delta]) => ({
        key: `system.attributes.${attr}.bonus`,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: String(delta)
      })),
      flags: { sacrophagia: { kind: "estado", tipo: estado.tipo, polaridade } }
    });
  }

  for (const [id, condicao] of Object.entries(CONDICOES)) {
    effects.push({
      id,
      name: `SACROPHAGIA.Condicoes.${id}`,
      img: condicao.img,
      flags: { sacrophagia: { kind: "condicao" } }
    });
  }

  return effects;
}
