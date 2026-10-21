import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://vkjhsxeoxzjpwezbwluw.supabase.co',
  'sb_publishable_33cJlkuVXi5oAsJkb8Qbhw_7-WNU899'
);

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(cb) {
  return supabase.auth.onAuthStateChange(cb);
}
