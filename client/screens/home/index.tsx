import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, TextInput, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/utils/api';

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

const GAMES = ['全部', '王者荣耀', '和平精英', '原神', '英雄联盟', '永劫无间', '穿越火线'];

export default function HomeScreen() {
  const router = useSafeRouter();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<GameAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAccounts = useCallback(async () => {
    try {
      let url = `${API_BASE_URL}/accounts`;
      const params: string[] = [];
      if (selectedGame !== '全部') params.push(`game_name=${encodeURIComponent(selectedGame)}`);
      if (searchQuery.trim()) params.push(`q=${encodeURIComponent(searchQuery.trim())}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await fetch(url);
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedGame, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAccounts();
    }, [fetchAccounts])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#22C55E';
      case 'in_use': return '#F59E0B';
      case 'maintenance': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '可租用';
      case 'in_use': return '使用中';
      case 'maintenance': return '维护中';
      default: return status;
    }
  };

  const renderAccountCard = ({ item }: { item: GameAccount }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push('/account-detail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.game_icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100' }}
          style={styles.gameIcon}
        />
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.gameName}>{item.game_name}</Text>
          <Text style={styles.serverName}>{item.server_name || '未知区服'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.rankInfo}>{item.rank_info || '暂无段位信息'}</Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.priceBox}>
          <Text style={styles.priceValue}>¥{item.price_per_hour}</Text>
          <Text style={styles.priceUnit}>/小时</Text>
        </View>
        <Pressable
          style={[styles.launchBtn, item.status !== 'available' && styles.launchBtnDisabled]}
          onPress={() => {
            if (item.status === 'available') {
              router.push('/launch', { accountId: item.id });
            }
          }}
          disabled={item.status !== 'available'}
        >
          <Text style={styles.launchBtnText}>
            {item.status === 'available' ? '立即上号' : '暂不可用'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <Screen backgroundColor="#0B0E1A" statusBarStyle="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.username || 'Player'}</Text>
            <Text style={styles.headerSubtitle}>选择账号，安全上号</Text>
          </View>
          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>余额</Text>
            <Text style={styles.balanceValue}>¥{user?.balance?.toFixed(0) || '0'}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索游戏账号..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={searchQuery}
            onChangeText={(text) => { setSearchQuery(text); fetchAccounts(); }}
            returnKeyLabel="search"
          />
        </View>

        {/* Game Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {GAMES.map((game) => (
            <Pressable
              key={game}
              style={[styles.filterChip, selectedGame === game && styles.filterChipActive]}
              onPress={() => { setSelectedGame(game); setLoading(true); fetchAccounts(); }}
            >
              <Text style={[styles.filterChipText, selectedGame === game && styles.filterChipTextActive]}>
                {game}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Account List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#6366F1" size="large" />
          </View>
        ) : (
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAccountCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#6366F1"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>暂无可用账号</Text>
              </View>
            }
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  greeting: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 },
  balanceBox: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  balanceValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  filterContainer: { paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  filterChipActive: { backgroundColor: '#6366F1' },
  filterChipText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  gameIcon: { width: 44, height: 44, borderRadius: 10 },
  cardHeaderInfo: { flex: 1, marginLeft: 12 },
  gameName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  serverName: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardBody: { marginBottom: 12 },
  rankInfo: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  description: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6, lineHeight: 18 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  priceBox: { flexDirection: 'row', alignItems: 'baseline' },
  priceValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  priceUnit: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 2 },
  launchBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  launchBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  launchBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
