import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
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
      const message = err instanceof Error ? err.message : '登录失败';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
      <View style={styles.container}>
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <View style={styles.shieldIcon}>
            <Text style={styles.shieldText}>SL</Text>
          </View>
          <Text style={styles.appName}>SHIELDLINK</Text>
          <Text style={styles.tagline}>游戏账号安全上号平台</Text>
          <View style={styles.glowLine} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入用户名"
              placeholderTextColor="#555570"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入密码"
              placeholderTextColor="#555570"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Pressable
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0F" />
            ) : (
              <Text style={styles.loginButtonText}>安全登录</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.registerLink}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerText}>没有账号？</Text>
            <Text style={styles.registerHighlight}>立即注册</Text>
          </Pressable>
        </View>

        {/* Bottom decoration */}
        <View style={styles.bottomArea}>
          <View style={styles.scanLine} />
          <Text style={styles.securityText}>SECURE CONNECTION ESTABLISHED</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  shieldIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,240,255,0.05)',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  shieldText: {
    color: '#00F0FF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  appName: {
    color: '#EAEAEA',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 6,
  },
  tagline: {
    color: '#555570',
    fontSize: 13,
    marginTop: 8,
    letterSpacing: 1,
  },
  glowLine: {
    width: 60,
    height: 2,
    marginTop: 16,
    backgroundColor: '#00F0FF',
    borderRadius: 1,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#555570',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#EAEAEA',
    fontSize: 15,
  },
  loginButton: {
    backgroundColor: '#00F0FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#0A0A0F',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  registerText: {
    color: '#555570',
    fontSize: 13,
  },
  registerHighlight: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomArea: {
    alignItems: 'center',
    marginTop: 48,
  },
  scanLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,240,255,0.08)',
    marginBottom: 16,
  },
  securityText: {
    color: '#555570',
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
