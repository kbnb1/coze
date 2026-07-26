import { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Screen backgroundColor="#0F0F1A" statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.username}>{user?.username || 'Unknown'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role === 'admin' ? '管理员' : '普通用户'}</Text>
          </View>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>账户余额</Text>
          <Text style={styles.balanceValue}>¥{user?.balance?.toFixed(2) || '0.00'}</Text>
        </View>

        {/* Info section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账号信息</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>用户ID</Text>
              <Text style={styles.infoValue}>{user?.id || '---'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>手机号</Text>
              <Text style={styles.infoValue}>{user?.phone || '未绑定'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>账号状态</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>正常</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>安全保障</Text>
          <View style={styles.securityCard}>
            <View style={styles.securityItem}>
              <View style={styles.securityIcon}>
                <Text style={styles.securityIconText}>🛡️</Text>
              </View>
              <View style={styles.securityInfo}>
                <Text style={styles.securityTitle}>设备安全</Text>
                <Text style={styles.securityDesc}>设备环境已检测</Text>
              </View>
              <View style={styles.securityOk}>
                <Text style={styles.securityOkText}>安全</Text>
              </View>
            </View>
            <View style={styles.securityDivider} />
            <View style={styles.securityItem}>
              <View style={[styles.securityIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <Text style={styles.securityIconText}>🔒</Text>
              </View>
              <View style={styles.securityInfo}>
                <Text style={styles.securityTitle}>隐私保护</Text>
                <Text style={styles.securityDesc}>账号密码加密存储</Text>
              </View>
              <View style={styles.securityOk}>
                <Text style={styles.securityOkText}>安全</Text>
              </View>
            </View>
            <View style={styles.securityDivider} />
            <View style={styles.securityItem}>
              <View style={[styles.securityIcon, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                <Text style={styles.securityIconText}>🚫</Text>
              </View>
              <View style={styles.securityInfo}>
                <Text style={styles.securityTitle}>外挂拦截</Text>
                <Text style={styles.securityDesc}>自动检测并拦截外挂</Text>
              </View>
              <View style={styles.securityOk}>
                <Text style={styles.securityOkText}>开启</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>极速上号 v1.0.0</Text>
          <Text style={styles.footerSubtext}>安全 · 快速 · 稳定</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  username: { fontSize: 20, fontWeight: '700', color: '#fff' },
  roleBadge: {
    marginTop: 6, paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 12,
  },
  roleText: { color: '#6366F1', fontSize: 12, fontWeight: '600' },
  balanceCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  balanceLabel: { fontSize: 13, color: '#888', marginBottom: 6 },
  balanceValue: { fontSize: 32, fontWeight: '700', color: '#F59E0B' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 10, letterSpacing: 1 },
  infoCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#E5E7EB', fontWeight: '500' },
  infoDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 14 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  statusText: { color: '#10B981', fontSize: 13, fontWeight: '500' },
  securityCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  securityItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  securityIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  securityIconText: { fontSize: 18 },
  securityInfo: { flex: 1, marginLeft: 12 },
  securityTitle: { fontSize: 14, fontWeight: '600', color: '#E5E7EB' },
  securityDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  securityOk: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 8,
  },
  securityOkText: { color: '#10B981', fontSize: 12, fontWeight: '600' },
  securityDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 14 },
  logoutButton: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 24 },
  footerText: { color: '#555', fontSize: 12 },
  footerSubtext: { color: '#444', fontSize: 11, marginTop: 4 },
});
