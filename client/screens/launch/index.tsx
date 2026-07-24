import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/utils/api';
import { collectDeviceFingerprint, runSecurityCheck } from '@/utils/security';
import Toast from 'react-native-toast-message';

type LaunchStep = 'checking' | 'secure' | 'risky' | 'launching' | 'launched' | 'error';

interface AccountInfo {
  id: number;
  game_name: string;
  game_icon: string | null;
  account_name: string;
  server_name: string | null;
  rank_info: string | null;
  price_per_hour: number;
}

export default function LaunchScreen() {
  const router = useSafeRouter();
  const { token } = useAuth();
  const { accountId } = useSafeSearchParams<{ accountId: number }>();
  const [step, setStep] = useState<LaunchStep>('checking');
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [riskInfo, setRiskInfo] = useState<{ score: number; level: string; issues: string[] }>({ score: 0, level: 'low', issues: [] });
  const [orderId, setOrderId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Fetch account info
  useEffect(() => {
    if (!accountId) return;
    fetch(`${API_BASE_URL}/accounts/${accountId}`)
      .then(r => r.json())
      .then(data => {
        if (data.account) setAccount(data.account);
      })
      .catch(() => {});
  }, [accountId]);

  // Run security check
  const runCheck = useCallback(async () => {
    setStep('checking');
    try {
      const fingerprint = await collectDeviceFingerprint();
      const result = await runSecurityCheck(fingerprint, token);

      if (result.risk_level === 'critical' || result.risk_level === 'high') {
        setRiskInfo({
          score: result.risk_score,
          level: result.risk_level,
          issues: result.issues || [],
        });
        setStep('risky');
        return;
      }

      setStep('secure');
      // Auto create order after 1.5s
      setTimeout(() => createOrder(fingerprint), 1500);
    } catch {
      setStep('error');
    }
  }, [token]);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  // Create order and launch
  const createOrder = async (fingerprint: string) => {
    if (!accountId || !account) return;
    setStep('launching');

    try {
      const response = await fetch(`${API_BASE_URL}/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_id: accountId,
          duration_hours: 1,
          device_fingerprint: fingerprint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Toast.show({ type: 'error', text1: data.error || '创建订单失败' });
        setStep('error');
        return;
      }

      setOrderId(data.order.id);
      setCountdown(data.order.duration_hours * 3600);

      // Simulate launch delay
      setTimeout(() => setStep('launched'), 2000);
    } catch {
      setStep('error');
    }
  };

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0 || step !== 'launched') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEndOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, step]);

  const handleEndOrder = async () => {
    if (!orderId || !token) return;
    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/end`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch {
      // ignore
    }
    router.replace('/');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderChecking = () => (
    <View style={styles.centerBox}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.stepTitle}>正在检测环境安全...</Text>
      <Text style={styles.stepDesc}>请稍候，正在扫描设备环境</Text>
      <View style={styles.checkItems}>
        {['Root/越狱检测', '模拟器检测', '悬浮窗检测', '可疑进程检测'].map((item, i) => (
          <View key={item} style={styles.checkItem}>
            <Text style={styles.checkDot}>◉</Text>
            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSecure = () => (
    <View style={styles.centerBox}>
      <View style={[styles.iconCircle, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
        <Text style={[styles.iconText, { color: '#22C55E' }]}>✓</Text>
      </View>
      <Text style={[styles.stepTitle, { color: '#22C55E' }]}>环境安全</Text>
      <Text style={styles.stepDesc}>设备检测通过，正在准备上号...</Text>
    </View>
  );

  const renderRisky = () => (
    <View style={styles.centerBox}>
      <View style={[styles.iconCircle, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
        <Text style={[styles.iconText, { color: '#EF4444' }]}>✕</Text>
      </View>
      <Text style={[styles.stepTitle, { color: '#EF4444' }]}>环境异常</Text>
      <Text style={styles.stepDesc}>检测到安全风险，已自动拒绝授权</Text>
      <View style={styles.riskBox}>
        <Text style={styles.riskLabel}>风险评分: {riskInfo.score}</Text>
        {riskInfo.issues.map((issue, i) => (
          <Text key={i} style={styles.riskIssue}>• {issue}</Text>
        ))}
      </View>
      <Pressable style={styles.backBtn} onPress={() => router.replace('/')}>
        <Text style={styles.backBtnText}>返回首页</Text>
      </Pressable>
    </View>
  );

  const renderLaunching = () => (
    <View style={styles.centerBox}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.stepTitle}>正在上号...</Text>
      <Text style={styles.stepDesc}>正在连接游戏服务器，请勿关闭应用</Text>
    </View>
  );

  const renderLaunched = () => (
    <View style={styles.centerBox}>
      <Image
        source={{ uri: account?.game_icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' }}
        style={styles.gameImage}
      />
      <Text style={styles.launchedTitle}>{account?.game_name || '游戏'}</Text>
      <Text style={styles.launchedSubtitle}>上号成功，正在游戏中</Text>

      <View style={styles.timerBox}>
        <Text style={styles.timerLabel}>剩余时间</Text>
        <Text style={styles.timerValue}>{formatTime(countdown)}</Text>
      </View>

      <View style={styles.sessionInfo}>
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>账号</Text>
          <Text style={styles.sessionValue}>{account?.account_name || '---'}</Text>
        </View>
        <View style={styles.sessionDivider} />
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>区服</Text>
          <Text style={styles.sessionValue}>{account?.server_name || '---'}</Text>
        </View>
      </View>

      <Pressable style={styles.endBtn} onPress={handleEndOrder}>
        <Text style={styles.endBtnText}>结束上号</Text>
      </Pressable>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerBox}>
      <View style={[styles.iconCircle, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
        <Text style={[styles.iconText, { color: '#EF4444' }]}>!</Text>
      </View>
      <Text style={styles.stepTitle}>上号失败</Text>
      <Text style={styles.stepDesc}>请检查网络连接后重试</Text>
      <Pressable style={styles.retryBtn} onPress={runCheck}>
        <Text style={styles.retryBtnText}>重试</Text>
      </Pressable>
      <Pressable style={styles.backBtn} onPress={() => router.replace('/')}>
        <Text style={styles.backBtnText}>返回首页</Text>
      </Pressable>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 'checking': return renderChecking();
      case 'secure': return renderSecure();
      case 'risky': return renderRisky();
      case 'launching': return renderLaunching();
      case 'launched': return renderLaunched();
      case 'error': return renderError();
    }
  };

  return (
    <Screen backgroundColor="#0B0E1A" statusBarStyle="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>安全上号</Text>
          <View style={{ width: 24 }} />
        </View>

        {renderStep()}
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
  backArrow: { color: '#FFFFFF', fontSize: 24 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: { fontSize: 36, fontWeight: '700' },
  stepTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 8 },
  stepDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 8, textAlign: 'center' },
  checkItems: { marginTop: 32, gap: 12, width: '100%' },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkDot: { color: '#6366F1', fontSize: 14 },
  checkText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  riskBox: {
    marginTop: 24,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  riskLabel: { color: '#EF4444', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  riskIssue: { color: 'rgba(239,68,68,0.7)', fontSize: 13, marginTop: 4 },
  gameImage: { width: 80, height: 80, borderRadius: 16, marginBottom: 16 },
  launchedTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  launchedSubtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 6 },
  timerBox: {
    marginTop: 32,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  timerLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  timerValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] },
  sessionInfo: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sessionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  sessionValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  sessionDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 10 },
  endBtn: {
    marginTop: 24,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  endBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  retryBtn: {
    marginTop: 24,
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  backBtn: {
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
});
