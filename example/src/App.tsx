import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Button,
  PermissionsAndroid,
} from 'react-native';
import {
  isBluetoothEnabled,
  enabledBluetooth,
  // requestBluetoothPermission,
  // enableBluetooth,
  // disableBluetooth,
} from 'rn-serial-bluetooth-classic';

// const result = multiply(3, 7);

interface BluetoothInfo {
  isEnabled: boolean;
}

export default function App() {
  const [bluetoothInfo, setBluetoothInfo] =
    React.useState<BluetoothInfo | null>(null);

  const requestBluetoothPermission = async () => {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    ]);

    return (
      granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
      granted['android.permission.BLUETOOTH_SCAN'] === 'granted'
    );
  };

  const checkBluetoothEnabled = async () => {
    try {
      const response = await isBluetoothEnabled();
      setBluetoothInfo({
        isEnabled: response.success,
      });
    } catch (error) {
      console.error('checkBluetoothEnabled::error::', error);
    }
  };

  const onEnableBluetooth = async () => {
    try {
      const response = await enabledBluetooth();
      setBluetoothInfo({
        isEnabled: response.success,
      });
      console.log('Enable Bluetooth:', response);
    } catch (error) {
      console.error('Error enabling Bluetooth:', error);
    }
  };

  React.useEffect(() => {
    requestBluetoothPermission();
    checkBluetoothEnabled();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Button title="Enable Bluetooth" onPress={onEnableBluetooth} />
      </View>
      <ScrollView>
        <Text>
          Has bluetooth enabled {bluetoothInfo?.isEnabled ? 'Yes' : 'No'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    width: '100%',
  },
});
