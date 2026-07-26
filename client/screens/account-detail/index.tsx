import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';

interface GameAccount {
  id: number;
  game_name: string;
  game_icon: string | null;
  account_name: string;
  server_name: string | null;
  rank_info: string | null;
  description: string | null;
  price_per_hour: number;
  deposit: number;
  status: string;
}

const GAME_COLORS: Record<string, string> = {
  '王者荣耀': '#F59E0B',
  '和平精英': '#10B981',
  '原神': '#8B5CF6',
  '英雄联盟': '#EF4444',
  '永劫无间': '#3B82F6',
  '穿越火线': '#F97316',
};

export default function AccountDetailScreen() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: number }>();
  const { token } = useAuth();
  const [account, setAccount] = useState<GameAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [duration, setDuration] = useState(1);

  const fetchAccount = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiRequest<{ account: GameAccount }>(`/accounts/${id}`, { token });
      setAccount(data.account);
    } catch {
      Toast.show({ type: 'error', text1: '加载失败' });
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => { fetchAccount(); }, [fetchAccount]));

  const handleLaunch = async () => {
    if (!account) return;
    if (account.status !== 'available') {
      Toast.show({ type: 'error', text1: '该账号已被租用' });
      return;
    }
    setLaunching(true);
    try {
      // Create order and start launch
      const orderData = await apiRequest<{ order: { id: number; order_no: string } }>('/orders/create', {
        method: 'POST',
        token,
        body: {
          account_id: account.id,
          duration_hours: duration,
          device_fingerprint: `device_${Date.now()}`,
          device_model: 'Mobile Device',
          os_version: '1.0',
          is_rooted: false,
          is_emulator: false,
          has_overlay: false,
        },
      });
      Toast.show({ type: 'success', text1: '上号成功！' });
      router.push('/launch', { orderId: orderData.order.id, accountId: account.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : '上号失败';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLaunching(false);
    }
  };

  if (loading) {
    return (
      <Screen backgroundColor="#0F0F1A" statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#6366F1" size="large" />
        </View>
      </Screen>
    );
  }

  if (!account) {
    return (
      <Screen backgroundColor="#0F0F1A" statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>账号不存在</Text>
          <Pressable style={styles.backBtnSimple} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>返回</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const color = GAME_COLORS[account.game_name] || '#6366F1';

  return (
    <Screen backgroundColor="#0F0F1A" statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back button */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← 返回</Text>
        </Pressable>

        {/* Game header */}
        <View style={styles.gameHeader}>
          {account.game_icon ? (
            <Image source={{ uri: account.game_icon }} style={styles.gameIcon} />
          ) : (
            <View style={[styles.gameIconPlaceholder, { backgroundColor: color + '22' }]}>
              <Text style={[styles.gameIconText, { color }]}>{account.game_name[0]}</Text>
            </View>
          )}
          <View style={styles.gameInfo}>
            <Text style={styles.gameName}>{account.game_name}</Text>
            <Text style={styles.serverName}>{account.server_name || '未知区服'}</Text>
          </View>
        </View>

        {/* Account info card */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>账号信息</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>账号名称</Text>
            <Text style={styles.infoValue}>{account.account_name}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>段位/等级</Text>
            <Text style={styles.infoValue}>{account.rank_info || '暂无'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>押金</Text>
            <Text style={styles.infoValue}>¥{account.deposit}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descCard}>
          <Text style={styles.sectionTitle}>账号描述</Text>
          <Text style={styles.descText}>{account.description || '暂无描述'}</Text>
        </View>

        {/* Duration selector */}
        <View style={styles.durationCard}>
          <Text style={styles.sectionTitle}>租用时长</Text>
          <View style={styles.durationOptions}>
            {[1, 2, 3, 5].map(h => (
              <Pressable
                key={h}
                style={[styles.durationChip, duration === h && { backgroundColor: color, borderColor: color }]}
                onPress={() => setDuration(h)}
              >
                <Text style={[styles.durationChipText, duration === h && { color: '#fff' }]}>
                  {h}小时
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.totalPrice}>
            <Text style={styles.totalLabel}>费用合计</Text>
            <Text style={styles.totalValue}>¥{(account.price_per_hour * duration).toFixed(2)}</Text>
          </View>
        </View>

        {/* Launch button */}
        <View style={styles.bottomArea}>
          <Pressable
            style={[styles.launchBtn, { backgroundColor: color }, launching && { opacity: 0.6 }]}
            onPress={handleLaunch}
            disabled={launching}
          >
            {launching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.launchBtnText}>🎮 一键上号</Text>
            )}
          </Pressable>
          <Text style={styles.securityHint}>🛡️ 安全环境检测 · 密码加密传输 · 外挂自动拦截</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#888', fontSize: 15, marginBottom: 16 },
  backBtnSimple: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#6366F1', borderRadius: 10 },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: '#6366F1', fontSize: 15, fontWeight: '500' },
  gameHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  gameIcon: { width: 60, height: 60, borderRadius: 16 },
  gameIconPlaceholder: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  gameIconText: { fontSize: 24, fontWeight: '700' },
  gameInfo: { marginLeft: 16, flex: 1 },
  gameName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  serverName: { fontSize: 13, color: '#888', marginTop: 4 },
  infoCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#E5E7EB', fontWeight: '500' },
  infoDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  descCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  descText: { fontSize: 13, color: '#999', lineHeight: 20 },
  durationCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 18,
    marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  durationOptions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  durationChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#0F0F1A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  durationChipText: { color: '#888', fontSize: 14, fontWeight: '500' },
  totalPrice: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#888' },
  totalValue: { fontSize: 22, fontWeight: '700', color: '#F59E0B' },
  bottomArea: { marginTop: 4 },
  launchBtn: {
    borderRadius: 14, paddingVertical: 18, alignItems: 'center',
  },
  launchBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 2 },
  securityHint: { textAlign: 'center', color: '#555', fontSize: 11, marginTop: 12 },
});
