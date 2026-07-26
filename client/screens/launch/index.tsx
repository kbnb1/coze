import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/utils/api';
import { collectDeviceInfo } from '@/utils/security';
import Toast from 'react-native-toast-message';

type LaunchPhase = 'detecting' | 'checking' | 'success' | 'denied' | 'active';

interface SecurityResult {
  riskScore: number;
  risks: string[];
  action: string;
}

export default function LaunchScreen() {
  const router = useSafeRouter();
  const { token } = useAuth();
  const { accountId, duration } = useSafeSearchParams<{ accountId: number; duration: number }>();
  const [phase, setPhase] = useState<LaunchPhase>('detecting');
  const [securityResult, setSecurityResult] = useState<SecurityResult | null>(null);
  const [accountInfo, setAccountInfo] = useState<{ account_name: string; account_password: string } | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startLaunchProcess();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLaunchProcess = async () => {
    try {
      // Phase 1: Device detection
      setPhase('detecting');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const deviceInfo = await collectDeviceInfo();

      // Report device to server
      await apiRequest('/security/report-device', {
        method: 'POST',
        body: deviceInfo,
        token,
      });

      // Phase 2: Security check + Create order
      setPhase('checking');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const orderData = await apiRequest<{
        order: { id: number };
        account: { account_name: string; account_password: string };
        security: SecurityResult;
      }>('/orders/create', {
        method: 'POST',
        body: {
          account_id: accountId,
          duration_hours: duration,
          ...deviceInfo,
        },
        token,
      });

      setSecurityResult(orderData.security);
      setAccountInfo(orderData.account);
      setOrderId(orderData.order.id);

      if (orderData.security.action === 'deny') {
        setPhase('denied');
      } else {
        setPhase('success');
        setCountdown(duration * 3600);
        // Start countdown
        intervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 0) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '上号失败';
      if (message.includes('安全检测未通过')) {
        setPhase('denied');
      } else {
        Toast.show({ type: 'error', text1: message });
        router.back();
      }
    }
  };

  const handleEndSession = async () => {
    if (!orderId) return;
    try {
      await apiRequest(`/orders/${orderId}/end`, {
        method: 'POST',
        token,
      });
      if (intervalRef.current) clearInterval(intervalRef.current);
      Toast.show({ type: 'success', text1: '已归还账号' });
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      Toast.show({ type: 'error', text1: message });
    }
  };

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Detecting phase
  if (phase === 'detecting') {
    return (
      <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#00F0FF" size="large" />
          <Text style={styles.phaseTitle}>ENVIRONMENT DETECTION</Text>
          <Text style={styles.phaseSubtitle}>正在检测设备环境安全...</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
        </View>
      </Screen>
    );
  }

  // Checking phase
  if (phase === 'checking') {
    return (
      <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#BF00FF" size="large" />
          <Text style={styles.phaseTitle}>SECURITY CHECK</Text>
          <Text style={styles.phaseSubtitle}>正在进行安全验证...</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '75%', backgroundColor: '#BF00FF' }]} />
          </View>
        </View>
      </Screen>
    );
  }

  // Denied phase
  if (phase === 'denied') {
    return (
      <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
        <View style={styles.centerContainer}>
          <View style={styles.deniedIcon}>
            <Text style={styles.deniedIconText}>X</Text>
          </View>
          <Text style={styles.deniedTitle}>ACCESS DENIED</Text>
          <Text style={styles.deniedSubtitle}>安全检测未通过</Text>

          {securityResult?.risks && securityResult.risks.length > 0 && (
            <View style={styles.riskList}>
              {securityResult.risks.map((risk, i) => (
                <View key={i} style={styles.riskItem}>
                  <Text style={styles.riskDot}>!</Text>
                  <Text style={styles.riskText}>{risk}</Text>
                </View>
              ))}
            </View>
          )}

          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>返回</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // Success / Active phase
  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
      <View style={styles.activeContainer}>
        {/* Status header */}
        <View style={styles.statusHeader}>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>SESSION ACTIVE</Text>
          </View>
          <Text style={styles.countdown}>{formatCountdown(countdown)}</Text>
          <Text style={styles.countdownLabel}>剩余时间</Text>
        </View>

        {/* Account info */}
        <View style={styles.accountCard}>
          <Text style={styles.cardLabel}>GAME ACCOUNT</Text>
          <Text style={styles.cardValue}>{accountInfo?.account_name || '---'}</Text>

          <View style={styles.divider} />

          <Text style={styles.cardLabel}>PASSWORD</Text>
          <Text style={styles.cardValueMono}>{accountInfo?.account_password || '---'}</Text>

          {securityResult && (
            <>
              <View style={styles.divider} />
              <View style={styles.securityRow}>
                <Text style={styles.cardLabel}>RISK SCORE</Text>
                <Text style={[
                  styles.riskScoreValue,
                  { color: securityResult.riskScore >= 40 ? '#FFB800' : '#00FF88' },
                ]}>
                  {securityResult.riskScore}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>SECURITY NOTICE</Text>
          <Text style={styles.warningText}>
            请勿使用任何第三方外挂软件。系统将持续监控您的游戏环境，检测到违规行为将自动终止会话并封禁设备。
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionArea}>
          <Pressable style={styles.endButton} onPress={handleEndSession}>
            <Text style={styles.endButtonText}>归还账号</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  phaseTitle: {
    color: '#EAEAEA',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 24,
  },
  phaseSubtitle: {
    color: '#555570',
    fontSize: 13,
    marginTop: 8,
  },
  progressBar: {
    width: '80%',
    height: 3,
    backgroundColor: '#1E1E2E',
    borderRadius: 2,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 2,
  },
  deniedIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#FF003C',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,60,0.1)',
  },
  deniedIconText: {
    color: '#FF003C',
    fontSize: 32,
    fontWeight: '800',
  },
  deniedTitle: {
    color: '#FF003C',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 20,
  },
  deniedSubtitle: {
    color: '#555570',
    fontSize: 14,
    marginTop: 8,
  },
  riskList: {
    marginTop: 24,
    backgroundColor: '#12121A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,0,60,0.2)',
    padding: 16,
    width: '100%',
    gap: 10,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  riskDot: {
    color: '#FF003C',
    fontSize: 14,
    fontWeight: '800',
    width: 20,
    textAlign: 'center',
  },
  riskText: {
    color: '#EAEAEA',
    fontSize: 13,
    flex: 1,
  },
  backButton: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.3)',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  backButtonText: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  activeContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
  },
  activeText: {
    color: '#00FF88',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  countdown: {
    color: '#00F0FF',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 4,
  },
  countdownLabel: {
    color: '#555570',
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 4,
  },
  accountCard: {
    backgroundColor: '#12121A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.12)',
    padding: 20,
    marginBottom: 16,
  },
  cardLabel: {
    color: '#555570',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardValue: {
    color: '#EAEAEA',
    fontSize: 18,
    fontWeight: '700',
  },
  cardValueMono: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,240,255,0.06)',
    marginVertical: 16,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskScoreValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  warningCard: {
    backgroundColor: 'rgba(255,184,0,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  warningText: {
    color: '#EAEAEA',
    fontSize: 13,
    lineHeight: 20,
  },
  actionArea: {
    marginTop: 'auto',
    paddingBottom: 40,
  },
  endButton: {
    borderWidth: 1,
    borderColor: '#FF003C',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,60,0.05)',
  },
  endButtonText: {
    color: '#FF003C',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
