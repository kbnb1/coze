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
      const message = err instanceof Error ? err.message : '登录失败，请检查用户名密码';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen backgroundColor="#0F0F1A" statusBarStyle="light">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoOuter}>
                <View style={styles.logoInner}>
                  <Text style={styles.logoIcon}>🛡️</Text>
                </View>
              </View>
            </View>
            <Text style={styles.appName}>极速上号</Text>
            <Text style={styles.appDesc}>安全 · 快速 · 稳定</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>账号登录</Text>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>用户名</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入用户名"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>密码</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入密码"
                placeholderTextColor="#666"
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

            <Pressable
              style={styles.registerRow}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.registerPrompt}>没有账号？</Text>
              <Text style={styles.registerLink}>立即注册</Text>
            </Pressable>
          </View>

          {/* Demo hint */}
          <View style={styles.demoHint}>
            <Text style={styles.demoText}>测试账号: player01 / password123</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoOuter: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 28,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  appDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
    letterSpacing: 4,
  },
  formCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0F0F1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  loginBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 4,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerPrompt: {
    color: '#888',
    fontSize: 14,
  },
  registerLink: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  demoHint: {
    marginTop: 24,
    alignItems: 'center',
  },
  demoText: {
    color: '#555',
    fontSize: 12,
  },
});
