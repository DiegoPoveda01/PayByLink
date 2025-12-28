/**
 * Template de enlace de pago guardado
 */
export interface PaymentTemplate {
  id: string;
  name: string;
  amount?: number;
  currency: 'USDC' | 'XLM';
  description?: string;
  recipientAddress: string;
  expiresIn: number;
  createdAt: number;
  usageCount: number;
}

const STORAGE_KEY = 'paybylink_templates';

/**
 * Guardar template en localStorage
 */
export function saveTemplate(template: Omit<PaymentTemplate, 'id' | 'createdAt' | 'usageCount'>): PaymentTemplate {
  const templates = getTemplates();
  
  const newTemplate: PaymentTemplate = {
    ...template,
    id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    usageCount: 0,
  };

  templates.push(newTemplate);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));

  return newTemplate;
}

/**
 * Obtener todos los templates
 */
export function getTemplates(): PaymentTemplate[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

/**
 * Obtener template por ID
 */
export function getTemplate(id: string): PaymentTemplate | null {
  const templates = getTemplates();
  return templates.find(t => t.id === id) || null;
}

/**
 * Eliminar template
 */
export function deleteTemplate(id: string): boolean {
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  
  if (filtered.length === templates.length) {
    return false; // No se encontró
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Actualizar template
 */
export function updateTemplate(id: string, updates: Partial<Omit<PaymentTemplate, 'id' | 'createdAt'>>): boolean {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === id);

  if (index === -1) return false;

  templates[index] = {
    ...templates[index],
    ...updates,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return true;
}

/**
 * Incrementar contador de uso
 */
export function incrementTemplateUsage(id: string): void {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === id);

  if (index === -1) return;

  templates[index].usageCount++;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

/**
 * Obtener templates más usados
 */
export function getMostUsedTemplates(limit: number = 5): PaymentTemplate[] {
  const templates = getTemplates();
  return templates
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}
