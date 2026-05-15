import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { randomSpeciesExcluding, type SpeciesKey } from '@/lib/garden/species';

export const GARDEN_KEY = ['garden'] as const;
export const PACKETS_KEY = ['seed_packets'] as const;

export interface GardenPlant {
  id: string;
  user_id: string;
  species: SpeciesKey;
  origin_type: 'harvest' | 'seed_packet';
  origin_label: string;
  planted_at: string;
  fully_grown_at: string | null;
  position: number | null;
}

export interface SeedPacket {
  id: string;
  user_id: string;
  species: SpeciesKey;
  earned_from: string;
  earned_at: string;
  planted: boolean;
  planted_at: string | null;
}

export function useGardenPlants() {
  return useQuery<GardenPlant[]>({
    queryKey: GARDEN_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('planted_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as GardenPlant[];
    },
  });
}

export function useSeedPackets() {
  return useQuery<SeedPacket[]>({
    queryKey: PACKETS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seed_packets')
        .select('*')
        .eq('planted', false)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SeedPacket[];
    },
  });
}

export function useHarvestPlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ species, originLabel }: { species: SpeciesKey; originLabel: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert into garden
      await supabase.from('plants').insert({
        user_id: user.id,
        species,
        origin_type: 'harvest',
        origin_label: originLabel,
        fully_grown_at: new Date().toISOString(),
      });

      // Reset user_progress
      const newSpecies = randomSpeciesExcluding(species);
      await supabase
        .from('user_progress')
        .update({
          xp: 0,
          active_plant_species: newSpecies,
          active_plant_planted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      return newSpecies;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GARDEN_KEY });
      qc.invalidateQueries({ queryKey: ['user_progress'] });
    },
  });
}

export function usePlantSeedPacket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (packetId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: packet, error: pErr } = await supabase
        .from('seed_packets')
        .select('*')
        .eq('id', packetId)
        .single();
      if (pErr || !packet) throw new Error('Packet not found');

      const now = new Date();
      const fullyGrownAt = addDays(now, 3);

      // Create plant
      await supabase.from('plants').insert({
        user_id: user.id,
        species: packet.species,
        origin_type: 'seed_packet',
        origin_label: `Grown from a seed earned for: ${packet.earned_from}`,
        planted_at: now.toISOString(),
        fully_grown_at: fullyGrownAt.toISOString(),
      });

      // Mark packet as planted
      await supabase
        .from('seed_packets')
        .update({ planted: true, planted_at: now.toISOString() })
        .eq('id', packetId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GARDEN_KEY });
      qc.invalidateQueries({ queryKey: PACKETS_KEY });
    },
  });
}

export function useAddSeedPacket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ species, earnedFrom }: { species: SpeciesKey; earnedFrom: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('seed_packets').insert({
        user_id: user.id,
        species,
        earned_from: earnedFrom,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PACKETS_KEY }),
  });
}
