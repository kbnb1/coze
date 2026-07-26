import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

type LaunchPhase = 'checking' | 'injecting' | 'launching' | 'success' | 'error';

export default function LaunchScreen() {
  const router = useSafeRouter();
  const { orderId, accountId } = useSafeSearchParams<{ orderId: number; accountId: number }>();
  const { token } = useAuth();
  const [phase, setPhase] = useState<LaunchPhase>('checking');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('正在检测环境安全...');
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const simulateLaunch = useCallback(() => {
    const phases: { phase: LaunchPhase; progress: number; msg: string; delay: number }[] = [
      { phase: 'checking', progress: 20, msg: '正在检测环境安全...', delay: 1200 },
      { phase: 'checking', progress: 40, msg: '检测外挂程序...', delay: 1000 },
      { phase: 'injecting', progress: 60, msg: '注入安全模块...', delay: 800 },
      { phase: 'launching', progress: 80, msg: '正在启动游戏...', delay: 1200 },
      { phase: 'success', progress: 100, msg: '上号成功！游戏已启动', delay: 0 },
    ];

    let idx = 0;
    const runPhase = () => {
      if (idx >= phases.length) return;
      const p = phases[idx];
      setPhase(p.phase);
      setProgress(p.progress);
      setMessage(p.msg);
      idx++;
      if (p.delay > 0) {
        timerRef.current = setTimeout(runPhase, p.delay);
      }
    };
    runPhase();
  }, []);

  useEffect(() => {
    simulateLaunch();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [simulateLaunch]);

  const handleEndSession = async () => {
    if (!orderId) return;
    try {
      await apiRequest(`/orders/${orderId}/end`, { method: 'POST', token });
    } catch {
      // ignore
    }
    router.replace('/');
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case 'checking': return '🔍';
      case 'injecting': return '🔧';
      case 'launching': return '🚀';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'checking': return '#F59E0B';
      case 'injecting': return '#8B5CF6';
      case 'launching': return '#3B82F6';
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
    }
  };

  return (
    <Screen backgroundColor="#0F0F1A" statusBarStyle="light">
      <View style={styles.container}>
        {/* Progress circle */}
        <View style={styles.progressArea}>
          <View style={[styles.progressRing, { borderColor: getPhaseColor() + '33' }]}>
            <View style={[styles.progressInner, { borderColor: getPhaseColor() }]}>
              <Text style={styles.phaseIcon}>{getPhaseIcon()}</Text>
            </View>
          </View>
          <Text style={[styles.phaseText, { color: getPhaseColor() }]}>
            {progress}%
          </Text>
        </View>

        {/* Status message */}
        <Text style={styles.message}>{message}</Text>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: getPhaseColor() }]} />
        </View>

        {/* Steps */}
        <View style={styles.stepsArea}>
          <View style={styles.step}>
            <View style={[styles.stepDot, { backgroundColor: progress >= 20 ? '#10B981' : '#333' }]} />
            <Text style={[styles.stepText, { color: progress >= 20 ? '#E5E7EB' : '#555' }]}>环境安全检测</Text>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, { backgroundColor: progress >= 40 ? '#10B981' : '#333' }]} />
            <Text style={[styles.stepText, { color: progress >= 40 ? '#E5E7EB' : '#555' }]}>外挂程序扫描</Text>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, { backgroundColor: progress >= 60 ? '#10B981' : '#333' }]} />
            <Text style={[styles.stepText, { color: progress >= 60 ? '#E5E7EB' : '#555' }]}>安全模块注入</Text>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, { backgroundColor: progress >= 80 ? '#10B981' : '#333' }]} />
            <Text style={[styles.stepText, { color: progress >= 80 ? '#E5E7EB' : '#555' }]}>游戏启动</Text>
          </View>
          <View style={styles.step}>
            <View style={[styles.stepDot, { backgroundColor: progress >= 100 ? '#10B981' : '#333' }]} />
            <Text style={[styles.stepText, { color: progress >= 100 ? '#E5E7EB' : '#555' }]}>上号完成</Text>
          </View>
        </View>

        {/* Actions */}
        {phase === 'success' && (
          <View style={styles.actions}>
            <Pressable style={styles.endBtn} onPress={handleEndSession}>
              <Text style={styles.endBtnText}>结束上号</Text>
            </Pressable>
            <Text style={styles.hint}>请在规定时间内使用，超时将自动结束</Text>
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.actions}>
            <Text style={styles.errorDetail}>{errorMsg}</Text>
            <Pressable style={styles.retryBtn} onPress={() => router.back()}>
              <Text style={styles.retryBtnText}>返回重试</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  progressArea: { alignItems: 'center', marginBottom: 24 },
  progressRing: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 4, justifyContent: 'center', alignItems: 'center',
  },
  progressInner: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  phaseIcon: { fontSize: 36 },
  phaseText: { fontSize: 28, fontWeight: '700', marginTop: 12 },
  message: { fontSize: 16, color: '#E5E7EB', marginBottom: 24, textAlign: 'center' },
  progressBarBg: {
    width: '100%', height: 6, borderRadius: 3,
    backgroundColor: '#1A1A2E', marginBottom: 32, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  stepsArea: { width: '100%', gap: 12, marginBottom: 40 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepText: { fontSize: 14 },
  actions: { alignItems: 'center', width: '100%' },
  endBtn: {
    backgroundColor: '#EF4444', borderRadius: 12,
    paddingHorizontal: 40, paddingVertical: 14,
  },
  endBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  hint: { color: '#555', fontSize: 12, marginTop: 12 },
  errorDetail: { color: '#EF4444', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#6366F1', borderRadius: 12,
    paddingHorizontal: 40, paddingVertical: 14,
  },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
