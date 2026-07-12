/** Registro das configurações do sistema. */
export function registerSettings() {

  // Reserva de Praga do mestre: estado de mundo compartilhado pela mesa.
  // Editada pelo tracker (nunca pelo menu); onChange redesenha em todos os clientes.
  game.settings.register("sacrophagia", "praga", {
    name: "SACROPHAGIA.Settings.Praga.Name",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
    onChange: () => {
      ui.praga?.render();
      Hooks.callAll("sacrophagia.pragaChanged");
    }
  });

  // Automação da economia: Graça, Praga e Fome aplicadas a cada teste.
  // Mesa que prefere distribuir na mão desliga sem perder o sistema.
  game.settings.register("sacrophagia", "automacaoEconomia", {
    name: "SACROPHAGIA.Settings.AutomacaoEconomia.Name",
    hint: "SACROPHAGIA.Settings.AutomacaoEconomia.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Exibição do tracker de Praga ao carregar o mundo
  game.settings.register("sacrophagia", "mostrarPraga", {
    name: "SACROPHAGIA.Settings.MostrarPraga.Name",
    hint: "SACROPHAGIA.Settings.MostrarPraga.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });
}
