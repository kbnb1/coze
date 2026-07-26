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
      Toast.show({ type: 'error', text1: '两次密码不一致' });
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
    <Screen backgroundColor="#0F0F1A" statusBarStyle="light">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← 返回</Text>
            </Pressable>
            <Text style={styles.title}>注册账号</Text>
            <Text style={styles.subtitle}>创建您的上号账号</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
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
                placeholder="请输入密码（至少6位）"
                placeholderTextColor="#666"
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
                placeholderTextColor="#666"
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
                placeholderTextColor="#666"
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
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    color: '#6366F1',
    fontSize: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
  },
  formCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  inputWrapper: {
    marginBottom: 16,
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
  registerBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  registerBtnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 4,
  },
});
