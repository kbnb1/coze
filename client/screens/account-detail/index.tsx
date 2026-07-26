import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/utils/api';

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
  const { accountId } = useSafeSearchParams<{ accountId: number }>();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(1);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const data = await apiRequest<{ account: AccountDetail }>(`/accounts/${accountId}`);
          setAccount(data.account);
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      })();
    }, [accountId])
  );

  if (loading) {
    return (
      <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#00F0FF" size="large" />
        </View>
      </Screen>
    );
  }

  if (!account) {
    return (
      <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>账号不存在</Text>
        </View>
      </Screen>
    );
  }

  const totalPrice = account.price_per_hour * duration + account.deposit;

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< BACK'}</Text>
        </Pressable>

        {/* Hero section */}
        <View style={styles.hero}>
          {account.game_icon ? (
            <Image source={{ uri: account.game_icon }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Text style={styles.heroImageText}>{account.game_name[0]}</Text>
            </View>
          )}
          <View style={styles.heroInfo}>
            <Text style={styles.gameName}>{account.game_name}</Text>
            <Text style={styles.serverName}>{account.server_name || '未知区服'}</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{account.rank_info || '未知段位'}</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT INFO</Text>
          <Text style={styles.description}>{account.description || '暂无描述'}</Text>
        </View>

        {/* Duration selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RENTAL DURATION</Text>
          <View style={styles.durationRow}>
            {[1, 2, 3, 5, 8].map(h => (
              <Pressable
                key={h}
                style={[styles.durationBtn, duration === h && styles.durationBtnActive]}
                onPress={() => setDuration(h)}
              >
                <Text style={[styles.durationText, duration === h && styles.durationTextActive]}>
                  {h}小时
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Price breakdown */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>租金</Text>
            <Text style={styles.priceValue}>¥{account.price_per_hour} x {duration}小时</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>押金</Text>
            <Text style={styles.priceValue}>¥{account.deposit}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>合计</Text>
            <Text style={styles.totalValue}>¥{totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Launch button */}
        <Pressable
          style={styles.launchButton}
          onPress={() => router.push('/launch', { accountId: account.id, duration })}
        >
          <Text style={styles.launchButtonText}>安全上号</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF003C',
    fontSize: 14,
  },
  backBtn: {
    marginBottom: 20,
  },
  backText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
    padding: 16,
  },
  heroImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  heroImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: 'rgba(0,240,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageText: {
    color: '#00F0FF',
    fontSize: 28,
    fontWeight: '700',
  },
  heroInfo: {
    flex: 1,
    marginLeft: 16,
  },
  gameName: {
    color: '#EAEAEA',
    fontSize: 20,
    fontWeight: '800',
  },
  serverName: {
    color: '#555570',
    fontSize: 13,
    marginTop: 4,
  },
  rankBadge: {
    backgroundColor: 'rgba(191,0,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(191,0,255,0.3)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  rankText: {
    color: '#BF00FF',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,240,255,0.08)',
    marginVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#555570',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  description: {
    color: '#EAEAEA',
    fontSize: 14,
    lineHeight: 22,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  durationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.1)',
  },
  durationBtnActive: {
    backgroundColor: 'rgba(0,240,255,0.1)',
    borderColor: '#00F0FF',
  },
  durationText: {
    color: '#555570',
    fontSize: 13,
    fontWeight: '600',
  },
  durationTextActive: {
    color: '#00F0FF',
  },
  priceSection: {
    backgroundColor: '#12121A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.1)',
    padding: 16,
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    color: '#555570',
    fontSize: 13,
  },
  priceValue: {
    color: '#EAEAEA',
    fontSize: 13,
    fontWeight: '600',
  },
  priceDivider: {
    height: 1,
    backgroundColor: 'rgba(0,240,255,0.08)',
    marginVertical: 4,
  },
  totalLabel: {
    color: '#EAEAEA',
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: '#00F0FF',
    fontSize: 22,
    fontWeight: '800',
  },
  launchButton: {
    backgroundColor: '#00F0FF',
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  launchButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
