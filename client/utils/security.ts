import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from './api';

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

/**
 * Collect device fingerprint for security check
 */
export async function collectDeviceFingerprint(): Promise<string> {
  return getDeviceId();
}

/**
 * Run security check against backend
 */
export async function runSecurityCheck(
  fingerprint: string,
  token: string | null
): Promise<{
  risk_score: number;
  risk_level: string;
  issues: string[];
  allowed: boolean;
}> {
  const deviceInfo = await collectDeviceInfo();

  const response = await fetch(`${API_BASE_URL}/security/security-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      device_fingerprint: fingerprint,
      device_model: deviceInfo.device_model,
      os_version: deviceInfo.os_version,
      is_rooted: deviceInfo.is_rooted,
      is_emulator: deviceInfo.is_emulator,
      has_overlay: deviceInfo.has_overlay,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '安全检测失败');
  }

  return {
    risk_score: data.risk_score || 0,
    risk_level: data.risk_level || 'low',
    issues: data.issues || [],
    allowed: data.allowed !== false,
  };
}
