import React from 'react';
import {
  Button,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  enabledBluetooth,
  isBluetoothEnabled,
  typedBluetoothListener,
  type BluetoothStateChanged,
} from 'rn-serial-bluetooth-classic';

interface BluetoothInfo {
  isEnabled: boolean;
  changedState?: BluetoothStateChanged['state'];
}

export default function App() {
  const [bluetoothInfo, setBluetoothInfo] = React.useState<BluetoothInfo>({
    isEnabled: false,
  });

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
      setBluetoothInfo((prev) => ({
        ...(prev ?? {}),
        isEnabled: response.success,
      }));
    } catch (error) {
      console.error('checkBluetoothEnabled::error::', error);
    }
  };

  const onEnableBluetooth = async () => {
    try {
      const response = await enabledBluetooth();
      setBluetoothInfo((prev) => ({
        ...(prev ?? {}),
        isEnabled: response.success,
      }));
      console.log('Enable Bluetooth:', response);
    } catch (error) {
      console.error('Error enabling Bluetooth:', error);
    }
  };

  React.useEffect(() => {
    requestBluetoothPermission();
    checkBluetoothEnabled();

    return () => {};
  }, []);

  React.useEffect(() => {
    const sb = typedBluetoothListener('BluetoothStateChanged', (event) => {
      console.log('BluetoothStateChanged::event::', event.state);

      setBluetoothInfo(() => ({
        isEnabled: event.state === 'STATE_ON',
        changedState: event.state,
      }));
    });

    return () => {
      sb.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Button title="Enable Bluetooth" onPress={onEnableBluetooth} />
      </View>
      <ScrollView>
        <Text>
          Has bluetooth enabled: {bluetoothInfo.isEnabled ? 'Yes' : 'No'}
        </Text>
        {bluetoothInfo.changedState && (
          <Text>Last state change: {bluetoothInfo.changedState}</Text>
        )}
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
