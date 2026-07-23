import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Image, ActivityIndicator, TextInput } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/utils/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function HomeScreen() {
  const router = useSafeRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<GameAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games = ['全部', '王者荣耀', '和平精英', '原神', '英雄联盟', '永劫无间', '穿越火线'];

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint = '/accounts';
      if (selectedGame && selectedGame !== '全部') {
        endpoint = `/accounts/search?game=${encodeURIComponent(selectedGame)}`;
      }
      const data = await apiRequest<{ accounts: GameAccount[] }>(endpoint);
      setAccounts(data.accounts);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedGame]);

  useFocusEffect(
    useCallback(() => {
      fetchAccounts();
    }, [fetchAccounts])
  );

  const filteredAccounts = searchText
    ? accounts.filter(a =>
        a.game_name.includes(searchText) ||
        a.rank_info?.includes(searchText) ||
        a.description?.includes(searchText)
      )
    : accounts;

  const renderAccountCard = ({ item }: { item: GameAccount }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push('/account-detail', { accountId: item.id })}
    >
      <View style={styles.cardHeader}>
        {item.game_icon ? (
          <Image source={{ uri: item.game_icon }} style={styles.gameIcon} />
        ) : (
          <View style={styles.gameIconPlaceholder}>
            <Text style={styles.gameIconText}>{item.game_name[0]}</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.gameName}>{item.game_name}</Text>
          <Text style={styles.serverInfo}>{item.server_name || '未知区服'}</Text>
        </View>
        <View style={styles.priceArea}>
          <Text style={styles.priceValue}>{item.price_per_hour}</Text>
          <Text style={styles.priceUnit}>/时</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{item.rank_info || '未知段位'}</Text>
        </View>
        {item.deposit > 0 && (
          <View style={styles.depositBadge}>
            <Text style={styles.depositText}>押金 ¥{item.deposit}</Text>
          </View>
        )}
      </View>

      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>可租用</Text>
        </View>
        <Pressable
          style={styles.rentButton}
          onPress={() => router.push('/account-detail', { accountId: item.id })}
        >
          <Text style={styles.rentButtonText}>立即上号</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>SHIELDLINK</Text>
            <Text style={styles.headerSubtitle}>安全上号平台</Text>
          </View>
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceLabel}>BALANCE</Text>
            <Text style={styles.balanceValue}>¥{user?.balance?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索游戏/段位..."
            placeholderTextColor="#555570"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Game filter tabs */}
        <View style={styles.gameTabs}>
          {games.map(game => (
            <Pressable
              key={game}
              style={[
                styles.gameTab,
                (selectedGame === game || (game === '全部' && !selectedGame)) && styles.gameTabActive,
              ]}
              onPress={() => setSelectedGame(game === '全部' ? null : game)}
            >
              <Text
                style={[
                  styles.gameTabText,
                  (selectedGame === game || (game === '全部' && !selectedGame)) && styles.gameTabTextActive,
                ]}
              >
                {game}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#00F0FF" size="large" />
          <Text style={styles.loadingText}>LOADING...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAccounts}
          renderItem={renderAccountCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无可用账号</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0A0A0F',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#00F0FF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
  },
  headerSubtitle: {
    color: '#555570',
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 2,
  },
  balanceBadge: {
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  balanceLabel: {
    color: '#555570',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#00FF88',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  searchBar: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#EAEAEA',
    fontSize: 14,
  },
  gameTabs: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  gameTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.08)',
  },
  gameTabActive: {
    backgroundColor: 'rgba(0,240,255,0.1)',
    borderColor: '#00F0FF',
  },
  gameTabText: {
    color: '#555570',
    fontSize: 12,
    fontWeight: '600',
  },
  gameTabTextActive: {
    color: '#00F0FF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#12121A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  gameIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(0,240,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameIconText: {
    color: '#00F0FF',
    fontSize: 18,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  gameName: {
    color: '#EAEAEA',
    fontSize: 16,
    fontWeight: '700',
  },
  serverInfo: {
    color: '#555570',
    fontSize: 12,
    marginTop: 4,
  },
  priceArea: {
    alignItems: 'flex-end',
  },
  priceValue: {
    color: '#00F0FF',
    fontSize: 22,
    fontWeight: '800',
  },
  priceUnit: {
    color: '#555570',
    fontSize: 11,
  },
  cardBody: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  rankBadge: {
    backgroundColor: 'rgba(191,0,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(191,0,255,0.3)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rankText: {
    color: '#BF00FF',
    fontSize: 11,
    fontWeight: '600',
  },
  depositBadge: {
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  depositText: {
    color: '#00FF88',
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    color: '#555570',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,240,255,0.06)',
    paddingTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF88',
  },
  statusText: {
    color: '#00FF88',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  rentButton: {
    backgroundColor: '#00F0FF',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rentButtonText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#555570',
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#555570',
    fontSize: 14,
  },
});
