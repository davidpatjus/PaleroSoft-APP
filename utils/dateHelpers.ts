/**
 * Utilidades de formateo de fechas sin dependencias externas
 * Diseñado para ser robusto y manejar fechas inválidas gracefully
 */

/**
 * Valida si una fecha es válida
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Convierte un string a Date con validación
 */
export function parseDate(dateString: string | Date): Date | null {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return isValidDate(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Formatea hora en formato HH:mm
 */
export function formatTime(dateString: string | Date): string {
  const date = parseDate(dateString);
  if (!date) return '--:--';
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(date: Date): boolean {
  if (!isValidDate(date)) return false;
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

/**
 * Verifica si una fecha es ayer
 */
export function isYesterday(date: Date): boolean {
  if (!isValidDate(date)) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
}

/**
 * Verifica si dos fechas son el mismo día
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  if (!isValidDate(date1) || !isValidDate(date2)) return false;
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
}

/**
 * Array de nombres de meses en español
 */
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Formatea una fecha como "Hoy", "Ayer" o "DD de mes"
 */
export function formatDateDivider(dateString: string | Date): string {
  const date = parseDate(dateString);
  if (!date) return 'Fecha inválida';
  
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  return `${day} de ${month}`;
}

/**
 * Formatea una fecha en formato corto: DD/MM/YYYY
 */
export function formatShortDate(dateString: string | Date): string {
  const date = parseDate(dateString);
  if (!date) return '--/--/----';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha relativa (hace X tiempo)
 * Usado principalmente en listas de conversaciones
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = parseDate(dateString);
  if (!date) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Si es en el futuro, mostrar "Ahora"
  if (diffMs < 0) return 'Ahora';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays}d`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `hace ${weeks} sem`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `hace ${months} mes${months > 1 ? 'es' : ''}`;
  }
  
  const years = Math.floor(diffDays / 365);
  return `hace ${years} año${years > 1 ? 's' : ''}`;
}

/**
 * Formatea fecha completa: "DD de mes de YYYY"
 */
export function formatFullDate(dateString: string | Date): string {
  const date = parseDate(dateString);
  if (!date) return 'Fecha inválida';
  
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

/**
 * Formatea fecha y hora: "DD/MM/YYYY HH:mm"
 */
export function formatDateTime(dateString: string | Date): string {
  const date = parseDate(dateString);
  if (!date) return '--/--/---- --:--';
  
  return `${formatShortDate(date)} ${formatTime(date)}`;
}
