import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { API_BASE_URL } from '@/utils/api';
import { useFocusEffect } from 'expo-router';

interface AccountDetail {
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

export default function AccountDetailScreen() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: number }>();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      fetch(`${API_BASE_URL}/accounts/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.account) setAccount(data.account);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [id])
  );

  if (loading) {
    return (
      <Screen backgroundColor="#0B0E1A" statusBarStyle="light">
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#6366F1" size="large" />
        </View>
      </Screen>
    );
  }

  if (!account) {
    return (
      <Screen backgroundColor="#0B0E1A" statusBarStyle="light">
        <View style={styles.loadingBox}>
          <Text style={styles.errorText}>账号不存在</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>返回</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#0B0E1A" statusBarStyle="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>账号详情</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Game Info */}
          <View style={styles.gameCard}>
            <Image
              source={{ uri: account.game_icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' }}
              style={styles.gameIcon}
            />
            <View style={styles.gameInfo}>
              <Text style={styles.gameName}>{account.game_name}</Text>
              <Text style={styles.serverName}>{account.server_name || '未知区服'}</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: account.status === 'available' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
              }]}>
                <View style={[styles.statusDot, {
                  backgroundColor: account.status === 'available' ? '#22C55E' : '#F59E0B',
                }]} />
                <Text style={[styles.statusText, {
                  color: account.status === 'available' ? '#22C55E' : '#F59E0B',
                }]}>
                  {account.status === 'available' ? '可租用' : '使用中'}
                </Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>账号</Text>
              <Text style={styles.detailValue}>{account.account_name}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>段位</Text>
              <Text style={styles.detailValueHighlight}>{account.rank_info || '暂无'}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>押金</Text>
              <Text style={styles.detailValue}>¥{Number(account.deposit).toFixed(2)}</Text>
            </View>
          </View>

          {/* Description */}
          {account.description ? (
            <View style={styles.descCard}>
              <Text style={styles.descTitle}>账号描述</Text>
              <Text style={styles.descText}>{account.description}</Text>
            </View>
          ) : null}

          {/* Price */}
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>租用价格</Text>
              <View style={styles.priceValueBox}>
                <Text style={styles.priceCurrency}>¥</Text>
                <Text style={styles.priceAmount}>{account.price_per_hour}</Text>
                <Text style={styles.priceUnit}>/小时</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.launchBtn, account.status !== 'available' && styles.launchBtnDisabled]}
            onPress={() => {
              if (account.status === 'available') {
                router.push('/launch', { accountId: account.id });
              }
            }}
            disabled={account.status !== 'available'}
          >
            <Text style={styles.launchBtnText}>
              {account.status === 'available' ? '立即上号' : '暂不可用'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 16 },
  backBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backArrow: { color: '#FFFFFF', fontSize: 24 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 16 },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
  },
  gameIcon: { width: 64, height: 64, borderRadius: 14 },
  gameInfo: { flex: 1, marginLeft: 16 },
  gameName: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  serverName: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  detailValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  detailValueHighlight: { color: '#F59E0B', fontSize: 14, fontWeight: '600' },
  detailDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  descCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
  },
  descTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  descText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22 },
  priceCard: {
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderRadius: 16,
    padding: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  priceValueBox: { flexDirection: 'row', alignItems: 'baseline' },
  priceCurrency: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  priceAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  priceUnit: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 2 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: '#0B0E1A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  launchBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  launchBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  launchBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
