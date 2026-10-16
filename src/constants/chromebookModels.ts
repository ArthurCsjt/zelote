/**
 * Centralização oficial de Fabricantes e Modelos de Chromebooks.
 * Qualquer novo modelo ou fabricante adicionado aqui refletirá automaticamente
 * em todos os formulários e caixas de edição do sistema.
 */

export const BASE_MANUFACTURER_MODELS: Record<string, string[]> = {
  Acer: ['N18Q5', 'N24P1', 'N15Q8', 'N18Q12'],
  Samsung: ['XE500C13', 'XE310XBA', 'XE501C13', 'XE500c13'],
  Lenovo: ['100e Chromebook Gen 3'],
  HP: ['Chromebook 11 G8 EE', 'Chromebook 11 G9 EE'],
  Dell: ['Chromebook 3100'],
  Multilaser: ['Chromebook M11C'],
  Positivo: ['Chromebook C464'],
  Outro: [],
};

export const AVAILABLE_MANUFACTURERS: string[] = Object.keys(BASE_MANUFACTURER_MODELS);

/**
 * Retorna os modelos cadastrados para um fabricante, mesclando com modelos adicionais se fornecidos.
 */
export function getStandardModelsForManufacturer(manufacturer?: string | null, customModels: string[] = []): string[] {
  if (!manufacturer) return [];
  const base = BASE_MANUFACTURER_MODELS[manufacturer] || [];
  const combined = Array.from(new Set([...base, ...customModels]));
  return combined;
}
