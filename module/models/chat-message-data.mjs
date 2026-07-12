const { fields } = foundry.data;

/**
 * Snapshot serializável de um Teste em Pódio. A mensagem de chat é a fonte de
 * verdade do fluxo: os botões do cartão (Somar DE, Rolar Dano) reidratam tudo
 * daqui, sem refazer cálculo de regra.
 */
export class TesteMessageData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      actorUuid: new fields.StringField({ required: true, blank: true }),
      weaponUuid: new fields.StringField({ required: true, blank: true }),
      targetName: new fields.StringField({ required: true, blank: true }),
      outcome: new fields.StringField({ required: true, blank: true }),
      successes: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0, nullable: false }),
      highest: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0, nullable: false }),
      playerDice: new fields.ArrayField(new fields.SchemaField({
        attribute: new fields.StringField({ required: true, blank: true }),
        faces: new fields.NumberField({ required: true, integer: true, initial: 4, nullable: false }),
        total: new fields.NumberField({ required: true, integer: true, initial: 0, nullable: false })
      })),
      // Jogada Soma: o DE modifica UM dado do teste, depois da distribuição de
      // Graça e Praga (que nunca muda com modificações do resultado)
      soma: new fields.SchemaField({
        aplicada: new fields.BooleanField({ initial: false }),
        dieIndex: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0, nullable: false }),
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0, nullable: false })
      }),
      // Economia distribuída no momento do teste (registro para o cartão)
      economy: new fields.SchemaField({
        graca: new fields.NumberField({ required: true, integer: true, initial: 0, nullable: false }),
        praga: new fields.NumberField({ required: true, integer: true, initial: 0, nullable: false }),
        fome: new fields.NumberField({ required: true, integer: true, initial: 0, nullable: false }),
        manual: new fields.BooleanField({ initial: false }),
        // Praga que ficou sem GM conectado para receber (aplicação manual)
        pragaPendente: new fields.BooleanField({ initial: false })
      })
    };
  }
}

/** Snapshot de um cartão de dano: alimenta os botões Gula e Aplicar Dano. */
export class DanoMessageData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      actorUuid: new fields.StringField({ required: true, blank: true }),
      weaponUuid: new fields.StringField({ required: true, blank: true }),
      total: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0, nullable: false }),
      tipo: new fields.StringField({ required: true, blank: true }),
      critico: new fields.BooleanField({ initial: false }),
      gulaAplicada: new fields.BooleanField({ initial: false })
    };
  }
}
