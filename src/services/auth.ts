import { assertBackendReady } from '../lib/supabase';
import type { Profile } from '../types/database';

export async function getCurrentUser() {
  const client = assertBackendReady();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  const client = assertBackendReady();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function sendMagicLink(email: string) {
  const client = assertBackendReady();
  const { data, error } = await client.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = assertBackendReady();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getMyProfile(): Promise<Profile | null> {
  const client = assertBackendReady();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
