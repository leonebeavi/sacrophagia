/**
 * Sacrophagia, entry point do sistema.
 * Registra documentos, data models, fichas, rolagem, status effects,
 * settings, sockets e hooks de chat.
 */
import { SACROPHAGIA, buildStatusEffects } from "./module/config.mjs";
import { SacrophagiaActor } from "./module/documents/actor.mjs";
import { SacrophagiaItem } from "./module/documents/item.mjs";
import { CharacterData } from "./module/models/character-data.mjs";
import { NpcData } from "./module/models/npc-data.mjs";
import { ItemData } from "./module/models/item-data.mjs";
import { ArmaData } from "./module/models/arma-data.mjs";
import { ArmaduraData } from "./module/models/armadura-data.mjs";
import { CapacidadeData } from "./module/models/capacidade-data.mjs";
import { TesteMessageData, DanoMessageData } from "./module/models/chat-message-data.mjs";
import { CharacterSheet } from "./module/sheets/character-sheet.mjs";
import { NpcSheet } from "./module/sheets/npc-sheet.mjs";
import { SacrophagiaItemSheet } from "./module/sheets/item-sheet.mjs";
import { PodiumRoll } from "./module/dice/podium-roll.mjs";
import { AttributeDie, DifficultyDie, ExtraordinaryDie } from "./module/dice/terms.mjs";
import { PragaTracker } from "./module/apps/praga-tracker.mjs";
import { registerSettings } from "./module/helpers/settings.mjs";
import { registerSockets } from "./module/helpers/sockets.mjs";
import { registerChatHooks } from "./module/helpers/chat.mjs";

const { DocumentSheetConfig } = foundry.applications.apps;

Hooks.once("init", () => {
  console.log("sacrophagia | Inicializando o sistema");

  // Namespace público para macros e módulos de terceiros
  game.sacrophagia = {
    SacrophagiaActor,
    SacrophagiaItem,
    PodiumRoll,
    dice: { AttributeDie, DifficultyDie, ExtraordinaryDie }
  };
  CONFIG.SACROPHAGIA = SACROPHAGIA;

  // Comportamento dos documentos
  CONFIG.Actor.documentClass = SacrophagiaActor;
  CONFIG.Item.documentClass = SacrophagiaItem;

  // Schemas por subtipo (declarados em documentTypes no system.json)
  CONFIG.Actor.dataModels = { character: CharacterData, npc: NpcData };
  CONFIG.Item.dataModels = {
    arma: ArmaData,
    armadura: ArmaduraData,
    capacidade: CapacidadeData,
    item: ItemData
  };
  CONFIG.ChatMessage.dataModels = { teste: TesteMessageData, dano: DanoMessageData };

  // Rolagem do Teste em Pódio e termos com identidade (sobrevivem à serialização)
  CONFIG.Dice.rolls.push(PodiumRoll);
  Object.assign(CONFIG.Dice.termTypes, { AttributeDie, DifficultyDie, ExtraordinaryDie });

  // Estados e condições nomeados do sistema substituem a lista padrão do core
  CONFIG.statusEffects = buildStatusEffects();

  // Iniciativa provisória (capítulo em desenvolvimento): 1 dado de Nervo
  CONFIG.Combat.initiative = { formula: "1d@nervo", decimals: 0 };

  // Barras e valores rastreáveis do token
  CONFIG.Actor.trackableAttributes = {
    character: { bar: ["vida", "fome"], value: ["graca.value", "bens.value"] },
    npc: { bar: ["vida"], value: [] }
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
    types: ["arma", "armadura", "capacidade", "item"],
    makeDefault: true,
    label: "SACROPHAGIA.Sheets.Item"
  });

  registerSettings();
  registerChatHooks();
});

Hooks.once("ready", () => {
  registerSockets();

  // Tracker da Praga do mestre, visível para toda a mesa
  if (game.settings.get("sacrophagia", "mostrarPraga")) {
    ui.praga = new PragaTracker();
    ui.praga.render(true);
  }

  console.log("sacrophagia | Sistema pronto");
});
