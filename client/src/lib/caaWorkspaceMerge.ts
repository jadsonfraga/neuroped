import type { CaaCategory, CaaSymbol } from "@/data/caaBoard";

type Board = Record<string, CaaCategory>;

function symbolKey(item: CaaSymbol): string {
  return `${item[1]}|${item[2]}`;
}

/**
 * Mantém o catálogo-base atual como fonte da verdade para posição e conteúdo
 * padrão. Categorias/cartões personalizados de workspaces antigas são
 * preservados, mas uma versão antiga de uma categoria nunca pode esconder
 * cartões-base adicionados em releases posteriores.
 */
export function mergeCaaBoardWithCurrentDefaults(
  currentDefaults: Board,
  restored: Board,
  maxItemsPerCategory: number,
): Board {
  const merged: Board = JSON.parse(JSON.stringify(currentDefaults)) as Board;

  for (const [name, restoredCategory] of Object.entries(restored)) {
    const currentCategory = merged[name];
    if (!currentCategory) {
      merged[name] = restoredCategory;
      continue;
    }

    const seen = new Set(currentCategory.items.map(symbolKey));
    const restoredOnly = restoredCategory.items.filter((item) => {
      const key = symbolKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    merged[name] = {
      ...currentCategory,
      items: [...currentCategory.items, ...restoredOnly].slice(
        0,
        maxItemsPerCategory,
      ),
    };
  }

  return merged;
}
