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

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.username}>{user?.username || 'Unknown'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role === 'admin' ? 'ADMIN' : 'USER'}</Text>
          </View>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>ACCOUNT BALANCE</Text>
          <Text style={styles.balanceValue}>¥{user?.balance?.toFixed(2) || '0.00'}</Text>
          <View style={styles.balanceGlow} />
        </View>

        {/* Info section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT INFO</Text>

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
          <Text style={styles.sectionTitle}>SECURITY</Text>

          <View style={styles.securityCard}>
            <View style={styles.securityItem}>
              <View style={styles.securityIcon}>
                <Text style={styles.securityIconText}>S</Text>
              </View>
              <View style={styles.securityInfo}>
                <Text style={styles.securityTitle}>设备安全</Text>
                <Text style={styles.securityDesc}>设备环境已检测</Text>
              </View>
              <View style={styles.securityStatus}>
                <Text style={styles.securityOk}>OK</Text>
              </View>
            </View>

            <View style={styles.securityDivider} />

            <View style={styles.securityItem}>
              <View style={[styles.securityIcon, { backgroundColor: 'rgba(0,255,136,0.1)' }]}>
                <Text style={[styles.securityIconText, { color: '#00FF88' }]}>P</Text>
              </View>
              <View style={styles.securityInfo}>
                <Text style={styles.securityTitle}>隐私保护</Text>
                <Text style={styles.securityDesc}>账号密码加密存储</Text>
              </View>
              <View style={styles.securityStatus}>
                <Text style={styles.securityOk}>OK</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout button */}
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>SHIELDLINK v1.0.0</Text>
          <Text style={styles.footerSubtext}>Secure Gaming Platform</Text>
        </View>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#00F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,240,255,0.05)',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  avatarText: {
    color: '#00F0FF',
    fontSize: 28,
    fontWeight: '800',
  },
  username: {
    color: '#EAEAEA',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(191,0,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(191,0,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  roleText: {
    color: '#BF00FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  balanceCard: {
    backgroundColor: '#12121A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.15)',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  balanceLabel: {
    color: '#555570',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  balanceValue: {
    color: '#00FF88',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 8,
  },
  balanceGlow: {
    width: 40,
    height: 2,
    backgroundColor: '#00FF88',
    borderRadius: 1,
    marginTop: 12,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#555570',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#12121A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.08)',
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(0,240,255,0.04)',
  },
  infoLabel: {
    color: '#555570',
    fontSize: 13,
  },
  infoValue: {
    color: '#EAEAEA',
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 12,
    fontWeight: '600',
  },
  securityCard: {
    backgroundColor: '#12121A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.08)',
    padding: 16,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(0,240,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityIconText: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: '700',
  },
  securityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    color: '#EAEAEA',
    fontSize: 14,
    fontWeight: '600',
  },
  securityDesc: {
    color: '#555570',
    fontSize: 11,
    marginTop: 2,
  },
  securityStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 6,
  },
  securityOk: {
    color: '#00FF88',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  securityDivider: {
    height: 1,
    backgroundColor: 'rgba(0,240,255,0.04)',
    marginVertical: 4,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,0,60,0.3)',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(255,0,60,0.03)',
  },
  logoutText: {
    color: '#FF003C',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#555570',
    fontSize: 11,
    letterSpacing: 2,
  },
  footerSubtext: {
    color: '#333348',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
  },
});
