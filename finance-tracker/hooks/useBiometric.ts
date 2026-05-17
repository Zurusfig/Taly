import { Platform } from 'react-native';
import { getItem, setItem } from '@/lib/storage';

const KEY = 'biometric_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const LocalAuthentication = await import('expo-local-authentication');
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  return LocalAuthentication.isEnrolledAsync();
}

export async function getBiometricEnabled(): Promise<boolean> {
  try {
    const val = await getItem(KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await setItem(KEY, enabled ? 'true' : 'false');
}

export async function authenticate(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const LocalAuthentication = await import('expo-local-authentication');
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Taly',
    fallbackLabel: 'Use passcode',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}
