import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from './src/lib/supabase';
import { Session } from '@supabase/supabase-js';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import ScanningScreen from './src/screens/ScanningScreen';
import OrderStatusScreen from './src/screens/OrderStatusScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

function AccessDeniedScreen() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Access Restricted</Text>
      <Text style={{ color: '#cbd5e1', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
        This mobile app is only available for MSME and Buyer users. Please sign in with an authorized account.
      </Text>
      <TouchableOpacity onPress={handleSignOut} style={{ backgroundColor: '#4f46e5', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 }}>
        <Text style={{ color: 'white', fontWeight: '700' }}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

export const RoleContext = React.createContext<{ role: 'msme' | 'buyer' | 'admin' | 'subadmin' | null }>({ role: null });

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [roleState, setRoleState] = useState<'loading' | 'msme' | 'buyer' | 'admin' | 'subadmin' | 'denied'>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const resolveRole = async () => {
      if (!session?.user) {
        if (!cancelled) setRoleState('loading');
        return;
      }

      try {
        const metaRole = (session.user.user_metadata as any)?.role;
        if (typeof metaRole === 'string' && ['msme', 'buyer', 'admin', 'subadmin'].includes(metaRole.toLowerCase())) {
          if (!cancelled) setRoleState(metaRole.toLowerCase() as any);
          return;
        }

        const { data: profile, error } = await supabase
          .from('users') // Notice we check 'users' table not 'profiles' based on web context
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!error && profile?.role) {
          const r = String(profile.role).toLowerCase();
          if (['msme', 'buyer', 'admin', 'subadmin'].includes(r)) {
            if (!cancelled) setRoleState(r as any);
            return;
          }
        }

        if (!cancelled) setRoleState('denied');
      } catch {
        if (!cancelled) setRoleState('denied');
      }
    };

    resolveRole();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  return (
    <RoleContext.Provider value={{ role: ['msme', 'buyer', 'admin', 'subadmin'].includes(roleState) ? (roleState as any) : null }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : roleState === 'denied' ? (
            <Stack.Screen name="AccessDenied" component={AccessDeniedScreen} />
          ) : (
            <>
              {(roleState === 'admin' || roleState === 'subadmin') ? (
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
              ) : (
                <>
                  <Stack.Screen name="Scanning" component={ScanningScreen} />
                  <Stack.Screen name="OrderStatus" component={OrderStatusScreen} />
                </>
              )}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </RoleContext.Provider>
  );
}
