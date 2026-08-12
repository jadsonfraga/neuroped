import assert from "node:assert/strict";
import type { CaaCategory } from "../../client/src/data/caaBoard";
import { mergeCaaBoardWithCurrentDefaults } from "../../client/src/lib/caaWorkspaceMerge";

type Board = Record<string, CaaCategory>;

const defaults: Board = {
  Essencial: {
    icon: "⭐",
    hint: "Atual",
    items: [
      ["💧", "Água", "Quero água"],
      ["🆕", "Novo", "Cartão novo da versão atual"],
    ],
  },
};

const restored: Board = {
  Essencial: {
    icon: "⭐",
    hint: "Versão antiga",
    items: [
      ["💧", "Água", "Quero água"],
      ["🚗", "Carrinho", "Quero meu carrinho"],
    ],
  },
  MinhaCategoria: {
    icon: "🏠",
    hint: "Personalizada",
    items: [["👵", "Vovó", "Quero a vovó"]],
  },
};

const merged = mergeCaaBoardWithCurrentDefaults(defaults, restored, 100);
assert.deepEqual(merged.Essencial.items, [
  ["💧", "Água", "Quero água"],
  ["🆕", "Novo", "Cartão novo da versão atual"],
  ["🚗", "Carrinho", "Quero meu carrinho"],
]);
assert.equal(merged.Essencial.hint, "Atual");
assert.deepEqual(merged.MinhaCategoria, restored.MinhaCategoria);

const capped = mergeCaaBoardWithCurrentDefaults(
  {
    Base: {
      icon: "B",
      hint: "",
      items: [["1", "Um", "Um"]],
    },
  },
  {
    Base: {
      icon: "B",
      hint: "",
      items: [
        ["2", "Dois", "Dois"],
        ["3", "Três", "Três"],
      ],
    },
  },
  2,
);
assert.equal(capped.Base.items.length, 2, "merge deve respeitar o limite seguro da categoria");

console.log("[caa-workspace-merge] ✓ catálogo atual e personalizações antigas coexistem sem esconder cartões novos.");
