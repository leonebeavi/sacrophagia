const { Die } = foundry.dice.terms;

/**
 * Dado de atributo na parada do jogador. A identidade do dado é a classe (nunca
 * a posição na fórmula); a chave do atributo viaja em options.attribute e
 * sobrevive à serialização da mensagem.
 */
export class AttributeDie extends Die {

  constructor(termData = {}) {
    super(termData);
    // A parada padrão não aceita modificadores de fórmula (kh, r, x...)
    this.modifiers = [];
  }

  /** Chave do atributo que este dado representa (carne, nervo, juizo, alma). */
  get attribute() {
    return this.options.attribute ?? null;
  }
}

/**
 * Parada de dificuldade: 1 a 3 dados da mesma face. O que importa não é a soma
 * e sim o MAIOR resultado, que os dados do jogador precisam alcançar.
 */
export class DifficultyDie extends Die {

  constructor(termData = {}) {
    super(termData);
    this.modifiers = [];
  }

  /** Maior resultado ativo da parada de dificuldade. */
  get highest() {
    const ativos = this.results.filter(r => r.active).map(r => r.result);
    return ativos.length ? Math.max(...ativos) : null;
  }
}

/**
 * Dado extraordinário (D4 a D12): a medida das capacidades de um personagem,
 * os tiers de jogo. Lançado para somar a um dado de teste (Soma) ou ao dano
 * (Gula), sempre depois da distribuição de Graça e Praga.
 */
export class ExtraordinaryDie extends Die {

  constructor(termData = {}) {
    super(termData);
    this.modifiers = [];
  }
}
