import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/utils/api';

interface Order {
  id: number;
  order_no: string;
  status: string;
  total_price: number;
  duration_hours: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  game_accounts: {
    game_name: string;
    game_icon: string | null;
    account_name: string;
    server_name: string | null;
  } | null;
}

export default function OrdersScreen() {
  const router = useSafeRouter();
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/orders/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setOrders(data.orders || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const handleEndOrder = async (orderId: number) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/end`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchOrders();
    } catch {
      // ignore
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22C55E';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '使用中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      case 'pending': return '待开始';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(o =>
    activeTab === 'active' ? o.status === 'active' : o.status !== 'active'
  );

  const renderOrderCard = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.gameName}>{item.game_accounts?.game_name || '未知游戏'}</Text>
          <Text style={styles.accountName}>{item.game_accounts?.account_name || '---'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>区服</Text>
          <Text style={styles.infoValue}>{item.game_accounts?.server_name || '---'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>时长</Text>
          <Text style={styles.infoValue}>{item.duration_hours}小时</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>费用</Text>
          <Text style={styles.infoValue}>¥{Number(item.total_price).toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>开始时间</Text>
          <Text style={styles.infoValue}>
            {item.started_at ? new Date(item.started_at).toLocaleString('zh-CN', { hour12: false }) : '---'}
          </Text>
        </View>
      </View>

      {item.status === 'active' && (
        <Pressable
          style={styles.endBtn}
          onPress={() => handleEndOrder(item.id)}
        >
          <Text style={styles.endBtnText}>结束上号</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <Screen backgroundColor="#0B0E1A" statusBarStyle="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>我的订单</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              进行中
            </Text>
            {activeTab === 'active' && <View style={styles.tabIndicator} />}
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              历史记录
            </Text>
            {activeTab === 'history' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>

        {/* Orders List */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              tintColor="#6366F1"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'active' ? '暂无进行中的订单' : '暂无历史订单'}
              </Text>
              {activeTab === 'active' && (
                <Pressable style={styles.goHomeBtn} onPress={() => router.replace('/')}>
                  <Text style={styles.goHomeText}>去租号</Text>
                </Pressable>
              )}
            </View>
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 24,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tab: { paddingBottom: 12, position: 'relative' },
  tabActive: {},
  tabText: { color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#6366F1',
    borderRadius: 1,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },
  goHomeBtn: {
    marginTop: 20,
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  goHomeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardHeaderLeft: { flex: 1 },
  gameName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  accountName: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  infoValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  endBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  endBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
});
