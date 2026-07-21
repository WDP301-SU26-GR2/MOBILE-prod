import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '../../../store/useThemeStore';
import { Typography } from '../../../components/Typography';
import { Button } from '../../../components/Button';
import { TextInput } from '../../../components/TextInput';
import { publicApi } from '../../../api/public';
import { colors } from '../../../theme/colors';
import { RecaptchaV3 } from '../../../components/RecaptchaV3';

export default function VoteOtpScreen() {
  const { periodId, selectedSeriesIds } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [step, setStep] = useState<'email' | 'otp'>('email');

  const recaptchaRef = React.useRef<any>(null);
  const [pendingAction, setPendingAction] = useState<'otp' | 'vote' | null>(null);

  const siteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY || '';
  const captchaUrl = 'https://captcha.novaproj.site'; // Make sure this is whitelisted in reCAPTCHA Admin

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const initiateSendCode = () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
      return;
    }
    setIsSending(true);
    setPendingAction('otp');
    recaptchaRef.current?.execute('otp');
  };

  const handleSendCode = async (token: string) => {
    try {
      await publicApi.sendVoteOtp(email, token);
      setStep('otp');
      setCooldown(60);
    } catch (error: any) {
      const errRes = error.response?.data;
      if (errRes?.code === 'Error.VoteOtpRateLimit' || error.response?.status === 429) {
        setCooldown(errRes?.retryAfter || 60);
        Alert.alert('Chờ một chút', errRes?.message || 'Bạn đã gửi mã quá nhiều lần, vui lòng thử lại sau.');
      } else {
        Alert.alert('Lỗi', errRes?.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại.');
      }
    } finally {
      setIsSending(false);
      setPendingAction(null);
    }
  };

  const initiateSubmitVote = () => {
    if (otp.length < 6) {
      Alert.alert('Lỗi', 'Mã xác nhận không hợp lệ');
      return;
    }
    setIsSubmitting(true);
    setPendingAction('vote');
    recaptchaRef.current?.execute('vote');
  };

  const handleSubmitVote = async (token: string) => {
    try {
      let seriesIds = [];
      try {
        seriesIds = JSON.parse(selectedSeriesIds as string);
      } catch (e) {
        console.error('Invalid series ids format', e);
      }
      
      await publicApi.submitVote({
        surveyPeriodId: periodId as string,
        identity: email,
        otpCode: otp,
        seriesIds,
        captchaToken: token
      });
      
      await AsyncStorage.setItem(`voted_${periodId}`, 'true');
      router.replace('/(public)/vote/done');
    } catch (error: any) {
      const errRes = error.response?.data;
      if (errRes?.code === 'Error.ReaderAlreadyVoted' || error.response?.status === 409) {
        Alert.alert('Thất bại', errRes?.message || 'Bạn đã bình chọn trong kỳ này rồi.');
      } else if (errRes?.code === 'Error.SurveyPeriodNotOpen' || errRes?.code === 'Error.OtpInvalid' || error.response?.status === 400) {
        Alert.alert('Thất bại', errRes?.message || 'Mã xác nhận sai hoặc kỳ bình chọn đã đóng.');
      } else {
        Alert.alert('Lỗi', errRes?.message || 'Không thể gửi phiếu bầu. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const handleRecaptchaToken = (token: string) => {
    if (pendingAction === 'otp') {
      handleSendCode(token);
    } else if (pendingAction === 'vote') {
      handleSubmitVote(token);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Typography variant="h2" style={[styles.title, { color: currentColors.text }]}>
            Xác thực bình chọn
          </Typography>
          <Typography variant="body" style={[styles.subtitle, { color: currentColors.textSecondary }]}>
            Để đảm bảo tính công bằng, chúng tôi cần xác thực email của bạn.
          </Typography>
          
          <View style={[styles.card, { backgroundColor: currentColors.surface }]}>
            <TextInput
              label="Địa chỉ Email"
              value={email}
              onChangeText={setEmail}
              placeholder="nhap@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={step === 'email' || cooldown === 0}
            />
            
            {step === 'email' ? (
              <Button
                title="Gửi mã"
                onPress={initiateSendCode}
                loading={isSending}
                style={styles.actionButton}
              />
            ) : (
              <View style={styles.resendContainer}>
                <Button
                  title={cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : "Gửi lại mã"}
                  onPress={initiateSendCode}
                  variant="outline"
                  disabled={cooldown > 0 || isSending}
                  style={styles.resendButton}
                />
              </View>
            )}
            
            {step === 'otp' && (
              <View style={styles.otpSection}>
                <TextInput
                  label="Mã xác nhận (6 số)"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                
                <Button
                  title="Gửi phiếu bầu"
                  onPress={initiateSubmitVote}
                  loading={isSubmitting}
                  disabled={otp.length !== 6}
                  style={styles.actionButton}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <RecaptchaV3 
        ref={recaptchaRef} 
        siteKey={siteKey} 
        url={captchaUrl} 
        onReceiveToken={handleRecaptchaToken} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  actionButton: {
    marginTop: 16,
  },
  resendContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  otpSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  }
});
