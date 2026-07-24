import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/Screen';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const router = useSafeRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: '请输入用户名和密码' });
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      Toast.show({ type: 'success', text1: '登录成功' });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请检查用户名和密码';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen backgroundColor="#0B0E1A" statusBarStyle="light">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <View style={styles.logoInner}>
              <Text style={styles.logoIcon}>🛡</Text>
            </View>
          </View>
          <Text style={styles.title}>游戏安全上号器</Text>
          <Text style={styles.subtitle}>专业账号租赁 · 安全加密上号</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>账号</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入用户名"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入密码"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Pressable
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>登 录</Text>
            )}
          </Pressable>

          <Pressable style={styles.registerRow} onPress={() => router.push('/register')}>
            <Text style={styles.registerHint}>还没有账号？</Text>
            <Text style={styles.registerLink}>立即注册</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>安全加密 · 防外挂检测 · 自动拒绝风险设备</Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBox: {
    marginBottom: 20,
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
    paddingLeft: 4,
  },
  input: {
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
  },
  loginBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 4,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  registerHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  registerLink: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 48,
  },
  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
  },
});
