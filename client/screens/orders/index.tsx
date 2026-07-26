import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';

interface Order {
  id: number;
  order_no: string;
  status: string;
  total_price: number;
  duration_hours: number;
  started_at: string | null;
  ended_at: string | null;
  security_status: string;
  risk_score: number;
  created_at: string;
  game_accounts: { game_name: string; account_name: string; server_name: string | null } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '使用中', color: '#10B981' },
  pending: { label: '待开始', color: '#F59E0B' },
  completed: { label: '已完成', color: '#888' },
  cancelled: { label: '已取消', color: '#EF4444' },
  terminated: { label: '已终止', color: '#EF4444' },
};

export default function OrdersScreen() {
  const router = useSafeRouter();
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiRequest<{ orders: Order[] }>('/orders/my', { token });
      setOrders(data.orders);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const handleEndOrder = async (orderId: number) => {
    try {
      await apiRequest(`/orders/${orderId}/end`, { method: 'POST', token });
      Toast.show({ type: 'success', text1: '已归还账号' });
      fetchOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      Toast.show({ type: 'error', text1: message });
    }
  };

  const filteredOrders = orders.filter(o =>
    tab === 'active' ? ['active', 'pending'].includes(o.status) : ['completed', 'cancelled', 'terminated'].includes(o.status)
  );

  const renderOrder = ({ item }: { item: Order }) => {
    const statusInfo = STATUS_MAP[item.status] || { label: item.status, color: '#888' };
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.gameInfo}>
            <Text style={styles.gameName}>{item.game_accounts?.game_name || '未知游戏'}</Text>
            <Text style={styles.accountName}>{item.game_accounts?.account_name || ''}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '22' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>订单号</Text>
            <Text style={styles.detailValue}>{item.order_no}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>时长</Text>
            <Text style={styles.detailValue}>{item.duration_hours}小时</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>费用</Text>
            <Text style={styles.detailValuePrice}>¥{item.total_price}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>安全状态</Text>
            <Text style={[styles.detailValue, { color: item.security_status === 'normal' ? '#10B981' : '#F59E0B' }]}>
              {item.security_status === 'normal' ? '正常' : '风险'}
            </Text>
          </View>
        </View>

        {item.status === 'active' && (
          <Pressable style={styles.endBtn} onPress={() => handleEndOrder(item.id)}>
            <Text style={styles.endBtnText}>归还账号</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <Screen backgroundColor="#0F0F1A" statusBarStyle="light">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>我的订单</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, tab === 'active' && styles.tabActive]}
            onPress={() => setTab('active')}
          >
            <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>使用中</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'history' && styles.tabActive]}
            onPress={() => setTab('history')}
          >
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>历史订单</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#6366F1" size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderOrder}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>{tab === 'active' ? '暂无进行中的订单' : '暂无历史订单'}</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  tabBar: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#1A1A2E', borderRadius: 12, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#6366F1' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 20, gap: 14, paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#666', fontSize: 14 },
  card: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  gameInfo: { flex: 1 },
  gameName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  accountName: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderDetails: { gap: 8, marginBottom: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 13, color: '#888' },
  detailValue: { fontSize: 13, color: '#E5E7EB' },
  detailValuePrice: { fontSize: 13, color: '#F59E0B', fontWeight: '600' },
  endBtn: {
    backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  endBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
