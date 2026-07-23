import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'shieldlink_device_id';

export async function getDeviceId(): Promise<string> {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;

  const rawId = `shieldlink-${Platform.OS}-${Platform.Version}-${Date.now()}`;
  const deviceId = Crypto.randomUUID();
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${rawId}-${deviceId}`
  );

  await AsyncStorage.setItem(DEVICE_ID_KEY, hash);
  return hash;
}

export interface DeviceInfo {
  device_fingerprint: string;
  device_model: string;
  os_version: string;
  is_rooted: boolean;
  is_emulator: boolean;
  has_overlay: boolean;
}

export async function collectDeviceInfo(): Promise<DeviceInfo> {
  const fingerprint = await getDeviceId();

  return {
    device_fingerprint: fingerprint,
    device_model: `${Platform.OS} ${Platform.Version}`,
    os_version: Platform.Version.toString(),
    is_rooted: false,
    is_emulator: false,
    has_overlay: false,
  };
}
