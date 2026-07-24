import { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
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

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  return (
    <Screen backgroundColor="#0B0E1A" statusBarStyle="light">
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
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>账户余额</Text>
            <Text style={styles.balanceValue}>¥{user?.balance?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Info section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账户信息</Text>
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
              <View style={styles.securityIconBox}>
                <Text style={styles.securityIcon}>🛡</Text>
              </View>
              <View style={styles.securityInfo}>
                <Text style={styles.securityTitle}>设备安全检测</Text>
                <Text style={styles.securityDesc}>Root/模拟器/悬浮窗/可疑进程</Text>
              </View>
              <View style={styles.securityOkBadge}>
                <Text style={styles.securityOkText}>已启用</Text>
              </View>
            </View>
            <View style={styles.securityDivider} />
            <View style={styles.securityItem}>
              <View style={[styles.securityIconBox, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                <Text style={styles.securityIcon}>🔒</Text>
              </View>
              <View style={styles.securityInfo}>
                <Text style={styles.securityTitle}>加密传输</Text>
                <Text style={styles.securityDesc}>账号密码加密存储，安全传输</Text>
              </View>
              <View style={styles.securityOkBadge}>
                <Text style={styles.securityOkText}>已启用</Text>
              </View>
            </View>
            <View style={styles.securityDivider} />
            <View style={styles.securityItem}>
              <View style={[styles.securityIconBox, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                <Text style={styles.securityIcon}>⚡</Text>
              </View>
              <View style={styles.securityInfo}>
                <Text style={styles.securityTitle}>自动拒绝外挂</Text>
                <Text style={styles.securityDesc}>检测到风险设备自动拒绝授权</Text>
              </View>
              <View style={styles.securityOkBadge}>
                <Text style={styles.securityOkText}>已启用</Text>
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
          <Text style={styles.footerText}>游戏安全上号器 v1.0.0</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#6366F1',
    fontSize: 28,
    fontWeight: '800',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  roleText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: '#22C55E',
  },
  statusText: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '500',
  },
  securityCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  securityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityIcon: {
    fontSize: 18,
  },
  securityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  securityDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  securityOkBadge: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  securityOkText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '600',
  },
  securityDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  logoutButton: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
  },
});
