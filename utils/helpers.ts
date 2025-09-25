/**
 * Trunca un texto a una longitud específica y añade '...' al final
 * @param text - El texto a truncar
 * @param maxLength - Longitud máxima (por defecto 150)
 * @returns El texto truncado
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
}
