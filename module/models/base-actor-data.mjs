import { SACROPHAGIA } from "../config.mjs";

const { fields } = foundry.data;

/**
 * Bloco de um atributo. Por enquanto guarda apenas o valor; o SchemaField
 * existe para que campos futuros (dano, marcas, condições) entrem sem exigir
 * migração de estrutura.
 */
function attributeField() {
  return new fields.SchemaField({
    value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1, nullable: false })
  });
}

/**
 * Base comum dos atores. Enquanto o corpo do sistema não é definido, todos os
 * atores compartilham os quatro atributos (Carne, Nervo, Juízo e Alma) e uma
 * biografia em texto rico.
 */
export class SacrophagiaActorBase extends foundry.abstract.TypeDataModel {

  static LOCALIZATION_PREFIXES = ["SACROPHAGIA.Actor.base"];

  static defineSchema() {
    const attributes = {};
    for (const key of Object.keys(SACROPHAGIA.attributes)) attributes[key] = attributeField();
    return {
      attributes: new fields.SchemaField(attributes),
      biography: new fields.HTMLField()
    };
  }

  /** Expõe atalhos @carne, @nervo, @juizo e @alma para fórmulas de rolagem. */
  getRollData() {
    const data = { ...this };
    for (const [key, attribute] of Object.entries(this.attributes)) data[key] = attribute.value;
    return data;
  }
}
