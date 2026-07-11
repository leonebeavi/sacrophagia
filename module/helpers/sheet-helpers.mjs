/**
 * Action compartilhada das fichas: abre o FilePicker para trocar a imagem
 * apontada por data-edit (padrão "img"). O `this` é a sheet, vinculado pelo
 * próprio ApplicationV2 na chamada da action.
 */
export async function onEditImage(event, target) {
  if (!this.isEditable) return;
  const attribute = target.dataset.edit ?? "img";
  const current = foundry.utils.getProperty(this.document, attribute);
  const picker = new foundry.applications.apps.FilePicker.implementation({
    current,
    type: "image",
    callback: path => this.document.update({ [attribute]: path })
  });
  return picker.browse();
}
