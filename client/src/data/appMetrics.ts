import { pharmCategories } from "@/data/farmacologia";
import { allScales } from "@/data/scaleFilter";
import { mergeFilterableCatalog, supplementalFilterableInstruments } from "@/data/filterableCatalog";
import { navigablePages } from "@/data/navigation";

const uniquePages = new Set(navigablePages.map((page) => page.href));
const allFilterable = mergeFilterableCatalog(allScales);

export const appMetrics = {
  scaleCount: allScales.length,
  filterableInstrumentCount: allFilterable.length,
  supplementalFilterableCount: supplementalFilterableInstruments.length,
  directTestCount: allFilterable.filter((item) => Boolean(item.appRoute)).length,
  medicationCount: pharmCategories.reduce((total, category) => total + category.drugs.length, 0),
  medicationCategoryCount: pharmCategories.length,
  pageCount: uniquePages.size,
  parentEducationCount: 8,
} as const;

export function metricLabel(value: number, suffix = "") {
  return `${value}${suffix}`;
}
