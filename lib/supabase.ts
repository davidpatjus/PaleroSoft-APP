import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseClient: SupabaseClient | null = null;

/**
 * Obtiene o crea una instancia singleton del cliente de Supabase.
 * Configurado con persistSession: false para manejar auth manualmente via JWT.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error(
        'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
      );
    }

    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseClient;
}

/**
 * Configura el token de autenticación para Supabase Realtime.
 * Debe llamarse con el token obtenido del endpoint /api/chat/supabase-token
 */
export async function setSupabaseAuth(realtimeToken: string): Promise<void> {
  const client = getSupabaseClient();
  await client.realtime.setAuth(realtimeToken);
}

/**
 * Conecta el cliente Realtime de Supabase.
 */
export function connectRealtime(): void {
  const client = getSupabaseClient();
  client.realtime.connect();
}

/**
 * Desconecta el cliente Realtime de Supabase.
 */
export function disconnectRealtime(): void {
  const client = getSupabaseClient();
  client.realtime.disconnect();
}

/**
 * Verifica si el cliente Realtime está conectado.
 */
export function isRealtimeConnected(): boolean {
  const client = getSupabaseClient();
  return client.realtime.isConnected();
}

/**
 * Remueve todos los canales activos de Realtime.
 */
export async function removeAllChannels(): Promise<void> {
  const client = getSupabaseClient();
  await client.removeAllChannels();
}

/**
 * Resetea la instancia del cliente (útil para testing o logout completo).
 */
export function resetSupabaseClient(): void {
  if (supabaseClient) {
    supabaseClient.removeAllChannels();
    supabaseClient = null;
  }
}
