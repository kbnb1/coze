import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
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
      Toast.show({ type: 'error', text1: '密码长度至少6位' });
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
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{'< BACK'}</Text>
          </Pressable>
          <Text style={styles.title}>CREATE ACCOUNT</Text>
          <Text style={styles.subtitle}>创建安全账号</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={styles.input}
              placeholder="设置用户名"
              placeholderTextColor="#555570"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PHONE</Text>
            <TextInput
              style={styles.input}
              placeholder="手机号码（选填）"
              placeholderTextColor="#555570"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="设置密码（至少6位）"
              placeholderTextColor="#555570"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="确认密码"
              placeholderTextColor="#555570"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <Pressable
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0F" />
            ) : (
              <Text style={styles.submitButtonText}>安全注册</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  backBtn: {
    marginBottom: 24,
  },
  backText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#EAEAEA',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 4,
  },
  subtitle: {
    color: '#555570',
    fontSize: 13,
    marginTop: 8,
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
  submitButton: {
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
  submitButtonText: {
    color: '#0A0A0F',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
