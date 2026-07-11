/**
 * Sacrophagia — entry point do sistema.
 * Registra documentos, data models, fichas e a classe de rolagem no init.
 */
import { SACROPHAGIA } from "./module/config.mjs";
import { SacrophagiaActor } from "./module/documents/actor.mjs";
import { SacrophagiaItem } from "./module/documents/item.mjs";
import { CharacterData } from "./module/models/character-data.mjs";
import { NpcData } from "./module/models/npc-data.mjs";
import { ItemData } from "./module/models/item-data.mjs";
import { CharacterSheet } from "./module/sheets/character-sheet.mjs";
import { NpcSheet } from "./module/sheets/npc-sheet.mjs";
import { SacrophagiaItemSheet } from "./module/sheets/item-sheet.mjs";
import { SacrophagiaRoll } from "./module/dice/sacrophagia-roll.mjs";

const { DocumentSheetConfig } = foundry.applications.apps;

Hooks.once("init", () => {
  console.log("sacrophagia | Inicializando o sistema");

  // Namespace público para macros e módulos de terceiros
  game.sacrophagia = { SacrophagiaActor, SacrophagiaItem, SacrophagiaRoll };
  CONFIG.SACROPHAGIA = SACROPHAGIA;

  // Comportamento dos documentos
  CONFIG.Actor.documentClass = SacrophagiaActor;
  CONFIG.Item.documentClass = SacrophagiaItem;

  // Schemas por subtipo (declarados em documentTypes no system.json)
  CONFIG.Actor.dataModels = { character: CharacterData, npc: NpcData };
  CONFIG.Item.dataModels = { item: ItemData };

  // Classe de rolagem do sistema (cartão temático; degrada para o padrão)
  CONFIG.Dice.rolls.unshift(SacrophagiaRoll);

  // Atributos rastreáveis no menu de barras do token
  const attributePaths = Object.keys(SACROPHAGIA.attributes).map(k => `attributes.${k}.value`);
  CONFIG.Actor.trackableAttributes = {
    character: { bar: [], value: attributePaths },
    npc: { bar: [], value: attributePaths }
  };

  // Fichas
  DocumentSheetConfig.registerSheet(Actor, "sacrophagia", CharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "SACROPHAGIA.Sheets.Character"
  });
  DocumentSheetConfig.registerSheet(Actor, "sacrophagia", NpcSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "SACROPHAGIA.Sheets.Npc"
  });
  DocumentSheetConfig.registerSheet(Item, "sacrophagia", SacrophagiaItemSheet, {
    types: ["item"],
    makeDefault: true,
    label: "SACROPHAGIA.Sheets.Item"
  });
});

Hooks.once("ready", () => {
  console.log("sacrophagia | Sistema pronto");
});
