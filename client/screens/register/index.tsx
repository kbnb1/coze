import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/Screen';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const router = useSafeRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: '请输入用户名和密码' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: '两次密码输入不一致' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: '密码至少6位' });
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), password, phone.trim() || undefined);
      Toast.show({ type: 'success', text1: '注册成功' });
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败';
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
        <View style={styles.header}>
          <Text style={styles.title}>创建账号</Text>
          <Text style={styles.subtitle}>注册后即可租用游戏账号</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>用户名</Text>
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
              placeholder="请输入密码（至少6位）"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>确认密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请再次输入密码"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>手机号（选填）</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Pressable
            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerBtnText}>注 册</Text>
            )}
          </Pressable>

          <Pressable style={styles.loginRow} onPress={() => router.back()}>
            <Text style={styles.loginHint}>已有账号？</Text>
            <Text style={styles.loginLink}>返回登录</Text>
          </Pressable>
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
    marginBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginTop: 8,
  },
  form: {
    gap: 14,
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
  registerBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerBtnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 4,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  loginHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  loginLink: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '600',
  },
});
