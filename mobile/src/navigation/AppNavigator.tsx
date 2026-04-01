import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useSync } from '../hooks/useSync';

import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AdvisoryInboxScreen } from '../screens/AdvisoryInboxScreen';
import { PestDiagnosisScreen } from '../screens/PestDiagnosisScreen';
import { PestLibraryScreen } from '../screens/PestLibraryScreen';
import { PestDetailScreen } from '../screens/PestDetailScreen';
import { SoilManagementScreen } from '../screens/SoilManagementScreen';
import { FinanceHomeScreen } from '../screens/FinanceHomeScreen';
import { RecordExpenseScreen } from '../screens/RecordExpenseScreen';
import { RecordSaleScreen } from '../screens/RecordSaleScreen';
import { FinanceSummaryScreen } from '../screens/FinanceSummaryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdvisoryInbox" component={AdvisoryInboxScreen} options={{ title: 'Advisory Inbox' }} />
      <Stack.Screen name="PestDiagnosis" component={PestDiagnosisScreen} options={{ title: 'Report Pest' }} />
      <Stack.Screen name="FinanceHome" component={FinanceHomeScreen} options={{ title: 'Finance' }} />
      <Stack.Screen name="RecordExpense" component={RecordExpenseScreen} options={{ title: 'Record Expense' }} />
      <Stack.Screen name="RecordSale" component={RecordSaleScreen} options={{ title: 'Record Sale' }} />
      <Stack.Screen name="FinanceSummary" component={FinanceSummaryScreen} options={{ title: 'Summary' }} />
      <Stack.Screen name="SoilManagement" component={SoilManagementScreen} options={{ title: 'Soil Management' }} />
    </Stack.Navigator>
  );
}

function PestStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PestLibrary" component={PestLibraryScreen} options={{ title: 'Pest Library' }} />
      <Stack.Screen name="PestDetail" component={PestDetailScreen} options={{ title: 'Pest Details' }} />
      <Stack.Screen name="PestDiagnosisForm" component={PestDiagnosisScreen} options={{ title: 'Report Pest' }} />
    </Stack.Navigator>
  );
}

function FinanceStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="FinanceHome" component={FinanceHomeScreen} options={{ title: 'Finance' }} />
      <Stack.Screen name="RecordExpense" component={RecordExpenseScreen} options={{ title: 'Record Expense' }} />
      <Stack.Screen name="RecordSale" component={RecordSaleScreen} options={{ title: 'Record Sale' }} />
      <Stack.Screen name="FinanceSummary" component={FinanceSummaryScreen} options={{ title: 'Summary' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  useSync();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#15803d',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Pest"
        component={PestStack}
        options={{ tabBarLabel: 'Pests', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🐛</Text> }}
      />
      <Tab.Screen
        name="Finance"
        component={FinanceStack}
        options={{ tabBarLabel: 'Finance', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💰</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
          headerShown: true,
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
