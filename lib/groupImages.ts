/**
 * Группировка изображений товаров по базовому имени.
 * Файлы: Iphone15pro.webp, Iphone15pro(2).webp, Iphone15pro(3).webp → один товар.
 * Возвращает: основная картинка (без скобок) первой, остальные отсортированы по (2), (3), ...
 */

export interface GroupedImages {
  baseName: string;
  /** Основная картинка (без скобок) + доп. (2), (3)... в порядке возрастания номера */
  files: string[];
}

/**
 * Извлекает базовое имя и номер из имени файла.
 * "Iphone15pro.webp" → { base: "Iphone15pro", index: 0 }  (0 = основная)
 * "Iphone15pro(2).webp" → { base: "Iphone15pro", index: 2 }
 */
function parseFilename(filename: string): { base: string; index: number } {
  const withoutExt = filename.replace(/\.webp$/i, '').trim();
  const match = withoutExt.match(/^(.*?)\s*\((\d+)\)\s*$/);
  if (match) {
    const base = match[1].replace(/\s+/g, '').toLowerCase();
    const index = parseInt(match[2], 10);
    return { base, index };
  }
  const base = withoutExt.replace(/\s+/g, '').toLowerCase();
  return { base, index: 0 };
}

/**
 * Группирует имена файлов .webp по товару.
 * @param filenames — список имён файлов (например из fs.readdir)
 * @returns Map: baseName → отсортированные имена [main, (2), (3), ...]
 */
export function groupImagesByProduct(filenames: string[]): Map<string, string[]> {
  const byBase = new Map<string, { index: number; filename: string }[]>();

  for (const f of filenames) {
    if (!/\.webp$/i.test(f)) continue;
    const { base, index } = parseFilename(f);
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base)!.push({ index, filename: f });
  }

  const result = new Map<string, string[]>();
  Array.from(byBase.entries()).forEach(([base, list]) => {
    const sorted = [...list].sort((a, b) => a.index - b.index);
    result.set(base, sorted.map((x) => x.filename));
  });
  return result;
}

/**
 * Преобразует результат groupImagesByProduct в массив путей для ProductCard.
 * basePathResolver(baseName, filename) → путь, напр. "/products/iphone15pro.webp"
 */
export function toImagePaths(
  grouped: Map<string, string[]>,
  basePathResolver: (baseName: string, filename: string) => string
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  Array.from(grouped.entries()).forEach(([base, files]) => {
    out.set(base, files.map((f) => basePathResolver(base, f)));
  });
  return out;
}
