import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Category, CategoryKind } from '@/lib/types';

export const CATEGORIES_KEY = ['categories'] as const;

const DEFAULT_CATEGORIES: Array<Pick<Category, 'name' | 'kind' | 'icon' | 'color'>> = [
  { name: 'Food', kind: 'expense', icon: 'utensils', color: '#E67E22' },
  { name: 'Transport', kind: 'expense', icon: 'car', color: '#3498DB' },
  { name: 'Shopping', kind: 'expense', icon: 'shopping-bag', color: '#9B59B6' },
  { name: 'Entertainment', kind: 'expense', icon: 'tv', color: '#E74C3C' },
  { name: 'Bills', kind: 'expense', icon: 'file-text', color: '#95A5A6' },
  { name: 'Health', kind: 'expense', icon: 'heart', color: '#E91E63' },
  { name: 'Education', kind: 'expense', icon: 'book', color: '#1ABC9C' },
  { name: 'Subscriptions', kind: 'expense', icon: 'refresh-cw', color: '#F39C12' },
  { name: 'Other', kind: 'expense', icon: 'more-horizontal', color: '#7F8C8D' },
  { name: 'Salary', kind: 'income', icon: 'briefcase', color: '#61988E' },
  { name: 'Freelance', kind: 'income', icon: 'code', color: '#27AE60' },
  { name: 'Investment', kind: 'income', icon: 'trending-up', color: '#2ECC71' },
  { name: 'Gift', kind: 'income', icon: 'gift', color: '#F1C40F' },
  { name: 'Other', kind: 'income', icon: 'more-horizontal', color: '#7F8C8D' },
];

export async function seedDefaultCategories() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { count } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if ((count ?? 0) > 0) return;
  const rows = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: user.id }));
  const { error } = await supabase.from('categories').insert(rows);
  if (error) throw error;
}

export function useCategories(kind?: CategoryKind) {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, kind],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      let q = supabase.from('categories').select('*').eq('archived', false).order('name');
      if (kind) q = q.eq('kind', kind);
      const { data, error } = await q;
      if (error) throw error;
      // Deduplicate by name+kind in case seedDefaultCategories ran more than once
      const seen = new Set<string>();
      return (data ?? []).filter((c) => {
        const key = `${c.kind}:${c.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }) as Category[];
    },
  });
}

type CategoryInput = Pick<Category, 'name' | 'kind' | 'icon' | 'color'>;

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('categories').insert({ ...input, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CategoryInput> & { id: string }) => {
      const { data, error } = await supabase.from('categories').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}

export function useArchiveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').update({ archived: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}
