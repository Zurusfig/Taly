import { Platform } from 'react-native';
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

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const FileSystem = await import('expo-file-system');
  const Sharing = await import('expo-sharing');
  const uri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Export Taly data' });
}

export async function importData(mode: 'overwrite' | 'merge'): Promise<void> {
  let content: string;

  if (Platform.OS === 'web') {
    content = await new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) { reject(new Error('No file selected')); return; }
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      };
      input.oncancel = () => reject(new Error('Cancelled'));
      input.click();
    });
  } else {
    const DocumentPicker = await import('expo-document-picker');
    const FileSystem = await import('expo-file-system');
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (result.canceled || !result.assets?.[0]) return;
    content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  }

  let dump: Record<string, unknown[]>;
  try {
    dump = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON file');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (mode === 'overwrite') {
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

  queryClient.invalidateQueries();
}
