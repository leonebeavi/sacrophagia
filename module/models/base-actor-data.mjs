import { SACROPHAGIA, DIE_STEPS, stepToFaces } from "../config.mjs";

const { fields } = foundry.data;

/**
 * Bloco de um atributo. O passo (0 a 4) indexa a escada D4 a D12; o bonus é o
 * acumulador de passos vindo de estados (Active Effects) e nunca é editado
 * diretamente pela ficha. A face efetiva é derivada dos dois.
 */
function attributeField() {
  return new fields.SchemaField({
    step: new fields.NumberField({
      required: true, integer: true, min: 0, max: DIE_STEPS.length - 1, initial: 1, nullable: false
    }),
    bonus: new fields.NumberField({ required: true, integer: true, initial: 0, nullable: false })
  });
}

/** Conjunto de tipos de dano (vulnerabilidades, resistências e imunidades). */
function damageTypeSetField() {
  return new fields.SetField(
    new fields.StringField({ required: true, choices: SACROPHAGIA.damageTypes })
  );
}

/**
 * Base comum dos atores: os quatro atributos, o dado extraordinário (tier de
 * jogo), a trilha de Vida, as defesas por tipo de dano e a biografia.
 *
 * Derivados calculados aqui: face efetiva de cada atributo (estados sobem ou
 * descem passos), Vida máxima (metade de Carne + metade do DE, passos BASE:
 * estados não alteram máximos), Esquiva (2 dados de Nervo efetivo), CA e
 * espaços de armadura (itens equipados) e os limiares da Pele e da Carne.
 */
export class SacrophagiaActorBase extends foundry.abstract.TypeDataModel {

  static LOCALIZATION_PREFIXES = ["SACROPHAGIA.Actor.base"];

  static defineSchema() {
    const attributes = {};
    for (const key of Object.keys(SACROPHAGIA.attributes)) attributes[key] = attributeField();
    return {
      attributes: new fields.SchemaField(attributes),
      extraordinario: new fields.SchemaField({
        tier: new fields.NumberField({
          required: true, integer: true, min: 0, max: 5, initial: 0, nullable: false
        })
      }),
      vida: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0, nullable: false })
      }),
      defesas: new fields.SchemaField({
        vulnerabilidades: damageTypeSetField(),
        resistencias: damageTypeSetField(),
        imunidades: damageTypeSetField()
      }),
      biography: new fields.HTMLField()
    };
  }

  prepareDerivedData() {
    // Atributos: face base (para máximos) e face efetiva (estados aplicados)
    for (const attribute of Object.values(this.attributes)) {
      attribute.effectiveStep = Math.clamp(attribute.step + attribute.bonus, 0, DIE_STEPS.length - 1);
      attribute.faces = DIE_STEPS[attribute.effectiveStep];
      attribute.die = `d${attribute.faces}`;
      attribute.baseFaces = stepToFaces(attribute.step);
    }

    // Dado extraordinário: tier 0 = sem DE
    const de = this.extraordinario;
    de.faces = de.tier > 0 ? DIE_STEPS[de.tier - 1] : null;
    de.die = de.faces ? `d${de.faces}` : null;

    // Vida máxima: metade do máximo de Carne + metade do máximo do DE (zero sem DE).
    // Usa passos base: estados não alteram o valor máximo de Vida.
    this.vida.max = (this.attributes.carne.baseFaces / 2) + (de.faces ? de.faces / 2 : 0);

    // Esquiva: parada de dificuldade de 2 dados de Nervo (face efetiva; estados afetam)
    this.esquiva = { count: 2, faces: this.attributes.nervo.faces };

    // Armadura equipada: maior CA não acumulável + soma das acumuláveis.
    // Espaços de armadura = CA total; marcas vivem em cada item de armadura.
    let caBase = 0;
    let caExtra = 0;
    let marcados = 0;
    for (const item of this.parent.items) {
      if (item.type !== "armadura" || !item.system.equipada) continue;
      if (item.system.acumulavel) caExtra += item.system.ca;
      else caBase = Math.max(caBase, item.system.ca);
      marcados += item.system.marcados;
    }
    const ca = caBase + caExtra;
    this.armadura = {
      ca,
      espacos: ca,
      marcados: Math.min(marcados, ca),
      livres: Math.max(ca - marcados, 0)
    };

    // Limiares de defesa: Pele = Vida máxima + CA; Carne = dobro da Vida máxima + CA
    this.limiares = {
      pele: this.vida.max + ca,
      carne: this.vida.max * 2 + ca
    };

    // Clamp de exibição da trilha (nunca persiste)
    this.vida.value = Math.clamp(this.vida.value, 0, this.vida.max);
  }

  /** Atalhos @carne, @nervo, @juizo, @alma e @de (faces efetivas) para fórmulas. */
  getRollData() {
    const data = { ...this };
    for (const [key, attribute] of Object.entries(this.attributes)) data[key] = attribute.faces;
    data.de = this.extraordinario.faces ?? 0;
    return data;
  }
}
