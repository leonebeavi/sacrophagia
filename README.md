# Sacrophagia

Sistema autoral e pessoal para **Foundry VTT (V14+)**, em desenvolvimento.

O corpo do sistema ainda não tem base fixa: este repositório contém o template
funcional base sobre o qual as regras serão implementadas.

## Atributos

A identidade do sistema são seus quatro atributos, cada um com forma e cor próprias:

| Atributo | Forma     | Cor       |
| -------- | --------- | --------- |
| Carne    | Círculo   | `#bb2a45` |
| Nervo    | Triângulo | `#f2ae2e` |
| Juízo    | Quadrado  | `#25adda` |
| Alma     | Losango   | `#a369dd` |

## Estado atual (v0.1.0)

Template base otimizado para o Foundry V14:

- Manifesto com `documentTypes` (sem `template.json`, depreciado no V14).
- Data models via `TypeDataModel` para atores (`character`, `npc`) e item genérico.
- Fichas `ApplicationV2` (`ActorSheetV2` / `ItemSheetV2`) com PARTS, TABS e actions declarativas.
- Rolagem de atributo provisória (`1d20 + atributo`) com cartão de chat temático.
- Tema escuro com a paleta dos atributos.
- i18n em inglês (base) e português do Brasil.
- `hotReload` ativo para `styles/`, `templates/` e `lang/`.

## Estrutura

```
sacrophagia/
├── system.json           ← manifesto
├── sacrophagia.mjs       ← entry point
├── lang/                 ← i18n (en, pt-BR)
├── styles/               ← tema escuro
├── templates/            ← Handlebars (actor, item, chat)
└── module/
    ├── config.mjs        ← CONFIG.SACROPHAGIA (atributos, formas, cores)
    ├── documents/        ← comportamento (Actor, Item)
    ├── models/           ← schemas (TypeDataModel)
    ├── sheets/           ← fichas ApplicationV2
    ├── dice/             ← rolagem do sistema
    └── helpers/          ← utilidades compartilhadas
```

## Desenvolvimento

Clone o repositório dentro da pasta de dados do Foundry:

```
<userData>/Data/systems/sacrophagia
```

Com o mundo aberto, alterações em `styles/`, `templates/` e `lang/` recarregam
sozinhas (hot reload); mudanças em `module/` pedem F5.

## Licença

Código sob a licença MIT (ver `LICENSE`). A identidade criativa do cenário e
das regras de Sacrophagia pertence ao autor.
