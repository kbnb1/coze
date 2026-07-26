import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/utils/api';
import Toast from 'react-native-toast-message';

interface Order {
  id: number;
  order_no: string;
  account_id: number;
  status: string;
  total_price: number;
  duration_hours: number;
  started_at: string | null;
  ended_at: string | null;
  security_status: string;
  risk_score: number;
  created_at: string;
  account: {
    game_name: string;
    game_icon: string | null;
    server_name: string | null;
    rank_info: string | null;
  } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '使用中', color: '#00FF88' },
  completed: { label: '已完成', color: '#555570' },
  terminated: { label: '已终止', color: '#FF003C' },
  pending: { label: '待开始', color: '#FFB800' },
};

export default function OrdersScreen() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const handleEndOrder = async (orderId: number) => {
    try {
      await apiRequest(`/orders/${orderId}/end`, {
        method: 'POST',
        token,
      });
      Toast.show({ type: 'success', text1: '已归还账号' });
      fetchOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      Toast.show({ type: 'error', text1: message });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.pending;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.gameName}>{item.account?.game_name || '未知游戏'}</Text>
            <Text style={styles.orderNo}>{item.order_no}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: `${statusInfo.color}40` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>区服</Text>
            <Text style={styles.infoValue}>{item.account?.server_name || '---'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>时长</Text>
            <Text style={styles.infoValue}>{item.duration_hours}小时</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>费用</Text>
            <Text style={styles.infoValueCyan}>¥{item.total_price}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>开始</Text>
            <Text style={styles.infoValue}>{formatDate(item.started_at)}</Text>
          </View>
        </View>

        {item.security_status === 'warning' && (
          <View style={styles.warningBar}>
            <Text style={styles.warningText}>SECURITY WARNING - Risk Score: {item.risk_score}</Text>
          </View>
        )}

        {item.status === 'active' && (
          <Pressable
            style={styles.endButton}
            onPress={() => handleEndOrder(item.id)}
          >
            <Text style={styles.endButtonText}>归还账号</Text>
          </Pressable>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#00F0FF" size="large" />
          <Text style={styles.loadingText}>LOADING...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MY ORDERS</Text>
        <Text style={styles.headerSubtitle}>订单记录</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无订单记录</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#EAEAEA',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
  },
  headerSubtitle: {
    color: '#555570',
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#12121A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.1)',
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  orderInfo: {
    flex: 1,
  },
  gameName: {
    color: '#EAEAEA',
    fontSize: 16,
    fontWeight: '700',
  },
  orderNo: {
    color: '#555570',
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#555570',
    fontSize: 12,
  },
  infoValue: {
    color: '#EAEAEA',
    fontSize: 12,
    fontWeight: '600',
  },
  infoValueCyan: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '700',
  },
  warningBar: {
    backgroundColor: 'rgba(255,184,0,0.08)',
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
  },
  warningText: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  endButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.3)',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
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
    paddingTop: 80,
  },
  emptyText: {
    color: '#555570',
    fontSize: 14,
  },
});
