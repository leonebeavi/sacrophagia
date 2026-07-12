/**
 * Canal de socket do sistema, no padrão GM-proxy: jogadores não têm permissão
 * para escrever settings de mundo, então emitem a intenção e o cliente do GM
 * ativo executa. O onChange do setting redesenha as UIs de todos os clientes.
 */
export const SOCKET_NAME = "system.sacrophagia";

const ACTIONS = {
  pragaDelta: "pragaDelta"
};

/** Valor atual da reserva de Praga do mestre. */
export function getPraga() {
  return game.settings.get("sacrophagia", "praga");
}

/** Escrita real da Praga: apenas no cliente do GM, nunca negativa. */
async function writePraga(value) {
  await game.settings.set("sacrophagia", "praga", Math.max(0, value));
}

/**
 * Fila de escrita: game.settings.set só atualiza o cache local após o
 * round-trip com o servidor, então deltas quase simultâneos fariam
 * read-modify-write sobre um valor velho. A cadeia de promises serializa as
 * escritas, e getPraga só é lido dentro da tarefa enfileirada.
 */
let pragaQueue = Promise.resolve();
function queuePragaDelta(delta) {
  pragaQueue = pragaQueue
    .then(() => writePraga(getPraga() + delta))
    .catch(err => console.error("sacrophagia | falha ao escrever Praga", err));
  return pragaQueue;
}

/**
 * Soma um delta à Praga do mestre. GM escreve direto; jogadores emitem a
 * intenção via socket. Retorna false quando não há GM conectado para aplicar
 * o delta (o chamador decide como sinalizar a aplicação manual).
 */
export async function addPraga(delta) {
  if (!delta) return true;
  if (game.user.isGM) {
    await queuePragaDelta(delta);
    return true;
  }
  if (!game.users.activeGM) {
    ui.notifications.warn(game.i18n.localize("SACROPHAGIA.Warn.PragaSemGM"));
    return false;
  }
  game.socket.emit(SOCKET_NAME, { action: ACTIONS.pragaDelta, data: { delta } });
  return true;
}

/** Registra o dispatcher do canal; chamar uma vez no ready. */
export function registerSockets() {
  game.socket.on(SOCKET_NAME, ({ action, data } = {}) => {
    // Apenas o GM ativo executa, para o delta não ser aplicado em dobro
    if (!game.user.isGM || game.users.activeGM?.id !== game.user.id) return;
    if (action === ACTIONS.pragaDelta) queuePragaDelta(data?.delta ?? 0);
  });
}
