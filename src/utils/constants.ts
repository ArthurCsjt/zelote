export interface ChromebookModel {
  model: string;
  manufacturer: string;
}

export const CHROMEBOOK_MODELS: ChromebookModel[] = [
  // Acer
  { model: 'Chromebook 11 N7 (C731)', manufacturer: 'Acer' },
  { model: 'Chromebook 11 (C733)', manufacturer: 'Acer' },
  { model: 'Chromebook 311 (C733)', manufacturer: 'Acer' },
  { model: 'N18Q5', manufacturer: 'Acer' },
  { model: 'N2P1', manufacturer: 'Acer' },
  { model: 'N24P1', manufacturer: 'Acer' },
  
  // Lenovo
  { model: 'Chromebook 300e', manufacturer: 'Lenovo' },
  { model: 'Chromebook 500e', manufacturer: 'Lenovo' },
  { model: 'Chromebook 100e', manufacturer: 'Lenovo' },
  
  // Samsung
  { model: 'Chromebook 4 (XE310XBA)', manufacturer: 'Samsung' },
  { model: 'Chromebook 3 (XE500C13)', manufacturer: 'Samsung' },
  { model: 'Chromebook Plus (XE501C13)', manufacturer: 'Samsung' },
  
  // HP (Modelos removidos, mas mantendo a lista de modelos limpa)
  
  // Outros (Modelos removidos)
  { model: 'Modelo Padrão (Manual)', manufacturer: 'Manual' },
];

export const MANUFACTURERS = [
  'Acer',
  'Lenovo',
  'Samsung',
  // HP e Outro removidos
];