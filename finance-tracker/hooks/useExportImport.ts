import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

const TABLES = ['wallets', 'categories', 'transactions', 'subscriptions', 'budgets', 'assets'] as const;

export async function exportData(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dump: Record<string, unknown[]> = { _version: 1, _exported_at: new Date().toISOString() } as any;

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    dump[table] = data ?? [];
  }

  const json = JSON.stringify(dump, null, 2);
  const filename = `taly-export-${new Date().toISOString().slice(0, 10)}.json`;
  const uri = FileSystem.cacheDirectory + filename;

  await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Export Taly data' });
}

export async function importData(mode: 'overwrite' | 'merge'): Promise<void> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  if (result.canceled || !result.assets?.[0]) return;

  const content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let dump: Record<string, unknown[]>;
  try {
    dump = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON file');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (mode === 'overwrite') {
    // Delete existing data in reverse FK order
    for (const table of [...TABLES].reverse()) {
      await supabase.from(table).delete().eq('user_id', user.id);
    }
  }

  for (const table of TABLES) {
    const rows = (dump[table] as any[]) ?? [];
    if (rows.length === 0) continue;
    const withUser = rows.map((r) => ({ ...r, user_id: user.id }));
    const { error } = await supabase.from(table).upsert(withUser, { onConflict: 'id' });
    if (error) throw error;
  }

  // Invalidate all queries
  queryClient.invalidateQueries();
}
