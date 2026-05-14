import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const otpComplete = otp.every((d) => d !== '');

  async function handleSend() {
    if (!isValid) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
    }
  }

  async function handleVerify() {
    const token = otp.join('');
    if (token.length !== 8) return;
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    });
    setVerifying(false);
    if (error) {
      Alert.alert('Invalid code', 'The code is incorrect or expired. Try requesting a new one.');
      setOtp(['', '', '', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  }

  function handleOtpKey(index: number, value: string) {
    if (value.length > 1) {
      // Handle paste: spread digits across boxes
      const digits = value.replace(/\D/g, '').slice(0, 8).split('');
      const next = [...otp];
      digits.forEach((d, i) => { if (index + i < 8) next[index + i] = d; });
      setOtp(next);
      const focusIndex = Math.min(index + digits.length, 7);
      inputRefs.current[focusIndex]?.focus();
      return;
    }
    const next = [...otp];
    next[index] = value.replace(/\D/g, '');
    setOtp(next);
    if (value && index < 7) inputRefs.current[index + 1]?.focus();
  }

  function handleOtpBackspace(index: number) {
    if (otp[index] === '' && index > 0) {
      const next = [...otp];
      next[index - 1] = '';
      setOtp(next);
      inputRefs.current[index - 1]?.focus();
    } else {
      const next = [...otp];
      next[index] = '';
      setOtp(next);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Taly</Text>
          <Text style={styles.subtitle}>Track every baht.</Text>
        </View>

        {!sent ? (
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Button
              label="Send code"
              onPress={handleSend}
              loading={loading}
              disabled={!isValid}
              style={styles.btn}
            />
          </View>
        ) : (
          <View style={styles.otpSection}>
            <Text style={styles.sentTitle}>Enter the code</Text>
            <Text style={styles.sentBody}>
              We sent an 8-digit code to{'\n'}
              <Text style={styles.sentEmail}>{email}</Text>
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { inputRefs.current[i] = r; }}
                  style={[styles.otpBox, digit !== '' && styles.otpBoxFilled]}
                  value={digit}
                  onChangeText={(v) => handleOtpKey(i, v)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') handleOtpBackspace(i);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus={i === 0}
                  selectTextOnFocus
                />
              ))}
            </View>

            <Button
              label="Verify"
              onPress={handleVerify}
              loading={verifying}
              disabled={!otpComplete}
            />

            <TouchableOpacity onPress={() => { setSent(false); setOtp(['', '', '', '', '', '']); }}>
              <Text style={styles.retry}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
    gap: 48,
  },
  header: { gap: 8 },
  title: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 48,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    color: colors.textMuted,
  },
  form: { gap: 16 },
  btn: { marginTop: 4 },
  otpSection: { gap: 16, alignItems: 'center' },
  sentTitle: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 28,
    color: colors.text,
  },
  sentBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  sentEmail: { color: colors.text, fontFamily: 'Inter_500Medium' },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  otpBox: {
    width: 38,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Inter_500Medium',
    color: colors.text,
  },
  otpBoxFilled: {
    borderColor: colors.accent,
  },
  retry: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
});
