import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Image, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

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

const GAME_FILTERS = ['全部', '王者荣耀', '和平精英', '原神', '英雄联盟', '永劫无间', '穿越火线'];

const GAME_COLORS: Record<string, string> = {
  '王者荣耀': '#F59E0B',
  '和平精英': '#10B981',
  '原神': '#8B5CF6',
  '英雄联盟': '#EF4444',
  '永劫无间': '#3B82F6',
  '穿越火线': '#F97316',
};

export default function HomeScreen() {
  const router = useSafeRouter();
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<GameAccount[]>([]);
  const [filtered, setFiltered] = useState<GameAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('全部');
  const [searchText, setSearchText] = useState('');

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ accounts: GameAccount[] }>('/accounts', { token });
      setAccounts(data.accounts);
      setFiltered(data.accounts);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchAccounts(); }, [fetchAccounts]));

  const handleFilter = (game: string) => {
    setActiveFilter(game);
    if (game === '全部') {
      setFiltered(accounts);
    } else {
      setFiltered(accounts.filter(a => a.game_name === game));
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      handleFilter(activeFilter);
      return;
    }
    const base = activeFilter === '全部' ? accounts : accounts.filter(a => a.game_name === activeFilter);
    setFiltered(base.filter(a =>
      a.game_name.includes(text) ||
      a.description?.includes(text) ||
      a.rank_info?.includes(text) ||
      a.server_name?.includes(text)
    ));
  };

  const renderAccount = ({ item }: { item: GameAccount }) => {
    const color = GAME_COLORS[item.game_name] || '#6366F1';
    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push('/account-detail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          {item.game_icon ? (
            <Image source={{ uri: item.game_icon }} style={styles.gameIcon} />
          ) : (
            <View style={[styles.gameIconPlaceholder, { backgroundColor: color + '22' }]}>
              <Text style={[styles.gameIconText, { color }]}>{item.game_name[0]}</Text>
            </View>
          )}
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.gameName}>{item.game_name}</Text>
            <Text style={styles.serverName}>{item.server_name || '未知区服'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'available' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'available' ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.statusText, { color: item.status === 'available' ? '#10B981' : '#EF4444' }]}>
              {item.status === 'available' ? '可租' : '已租'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.rankText} numberOfLines={1}>{item.rank_info || '暂无段位信息'}</Text>
          <Text style={styles.descText} numberOfLines={2}>{item.description || '暂无描述'}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.priceArea}>
            <Text style={styles.priceValue}>¥{item.price_per_hour}</Text>
            <Text style={styles.priceUnit}>/小时</Text>
          </View>
          <Pressable
            style={[styles.launchBtn, { backgroundColor: color }]}
            onPress={() => router.push('/account-detail', { id: item.id })}
          >
            <Text style={styles.launchBtnText}>立即上号</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen backgroundColor="#0F0F1A" statusBarStyle="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>极速上号</Text>
            <Text style={styles.headerSubtitle}>安全上号，拒绝外挂</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索游戏、区服、段位..."
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>

        {/* Filter tabs */}
        <FlatList
          data={GAME_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => handleFilter(item)}
            >
              <Text style={[styles.filterChipText, activeFilter === item && styles.filterChipTextActive]}>
                {item}
              </Text>
            </Pressable>
          )}
        />

        {/* Account list */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#6366F1" size="large" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAccount}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
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
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#fff' },
  filterList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterChipText: { color: '#888', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20, gap: 14 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#666', fontSize: 15 },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  gameIcon: { width: 44, height: 44, borderRadius: 12 },
  gameIconPlaceholder: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  gameIconText: { fontSize: 18, fontWeight: '700' },
  cardHeaderInfo: { flex: 1, marginLeft: 12 },
  gameName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  serverName: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardBody: { marginBottom: 14 },
  rankText: { fontSize: 14, fontWeight: '600', color: '#E5E7EB', marginBottom: 4 },
  descText: { fontSize: 12, color: '#888', lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceArea: { flexDirection: 'row', alignItems: 'baseline' },
  priceValue: { fontSize: 20, fontWeight: '700', color: '#F59E0B' },
  priceUnit: { fontSize: 12, color: '#888', marginLeft: 2 },
  launchBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 10,
  },
  launchBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
