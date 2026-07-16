import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { authApi } from '../../api/auth';
import { Mail, Lock, User, Phone } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirm_password: '',
    type: 'MANGAKA',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      await authApi.register(formData);
      router.push({
        pathname: '/(auth)/verify',
        params: { email: formData.email }
      });
    } catch (error: any) {
      // Mock flow
      router.push({
        pathname: '/(auth)/verify',
        params: { email: formData.email || 'test@example.com' }
      });
      // Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: currentColors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Typography variant="h1" font="headline" style={styles.title}>Create Account</Typography>
          <Typography variant="body" color={currentColors.textSecondary}>Sign up to get started</Typography>
        </View>
        
        <View style={styles.roleSelector}>
          <TouchableOpacity 
            style={[
              styles.roleButton, 
              { 
                backgroundColor: formData.type === 'MANGAKA' ? currentColors.primary : 'transparent',
                borderColor: formData.type === 'MANGAKA' ? currentColors.primary : currentColors.border
              }
            ]}
            onPress={() => updateForm('type', 'MANGAKA')}
          >
            <Typography variant="bodyMedium" color={formData.type === 'MANGAKA' ? '#fff' : currentColors.text}>
              Mangaka
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.roleButton, 
              { 
                backgroundColor: formData.type === 'ASSISTANT' ? currentColors.primary : 'transparent',
                borderColor: formData.type === 'ASSISTANT' ? currentColors.primary : currentColors.border
              }
            ]}
            onPress={() => updateForm('type', 'ASSISTANT')}
          >
            <Typography variant="bodyMedium" color={formData.type === 'ASSISTANT' ? '#fff' : currentColors.text}>
              Assistant
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Full Name"
            placeholder="Enter your name"
            value={formData.name}
            onChangeText={(text) => updateForm('name', text)}
            leftIcon={<User size={20} color={currentColors.textSecondary} />}
          />
          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(text) => updateForm('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={currentColors.textSecondary} />}
          />
          <TextInput
            label="Phone"
            placeholder="Enter your phone (+84...)"
            value={formData.phoneNumber}
            onChangeText={(text) => updateForm('phoneNumber', text)}
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={currentColors.textSecondary} />}
          />
          <TextInput
            label="Password"
            placeholder="Create a password"
            value={formData.password}
            onChangeText={(text) => updateForm('password', text)}
            secureTextEntry
            leftIcon={<Lock size={20} color={currentColors.textSecondary} />}
          />
          <TextInput
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirm_password}
            onChangeText={(text) => updateForm('confirm_password', text)}
            secureTextEntry
            leftIcon={<Lock size={20} color={currentColors.textSecondary} />}
          />
          
          <Button title="Sign Up" onPress={handleRegister} loading={loading} style={styles.button} />
          
          <View style={styles.footer}>
            <Typography variant="body" color={currentColors.textSecondary}>Already have an account? </Typography>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Typography variant="bodyBold" color={currentColors.primary}>Log In</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  header: { marginTop: 60, marginBottom: 32 },
  title: { marginBottom: 8 },
  roleSelector: { flexDirection: 'row', marginBottom: 24, gap: 12 },
  roleButton: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  form: { paddingBottom: 40 },
  button: { marginTop: 12, marginBottom: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
