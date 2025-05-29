import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  TouchableOpacity,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Alert,
} from 'react-native';
import {
  enabledBluetooth,
  getBondedDevices,
  isBluetoothEnabled,
  typedBluetoothListener,
  isConnected,
  type BluetoothStateChanged,
  type BluetoothDevice,
  startDiscovery,
  pairDevice,
  connect,
  disconnect,
  write,
} from 'rn-serial-bluetooth-classic';

interface BluetoothInfo {
  isEnabled: boolean;
  changedState?: BluetoothStateChanged['state'];
  bondedDevices: BluetoothDevice[];
  discoveryDevices: BluetoothDevice[];
  discoveryFinished: boolean;
  connectedDevice: BluetoothDevice | null;
  isConnected: boolean;
}

const App: React.FC = () => {
  const [bluetoothInfo, setBluetoothInfo] = useState<BluetoothInfo>({
    isEnabled: false,
    bondedDevices: [],
    discoveryDevices: [],
    discoveryFinished: false,
    connectedDevice: null,
    isConnected: false,
  });

  // Permissions
  const requestPermissions = async () => {
    try {
      const bluetoothGranted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);
      const locationGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      return (
        bluetoothGranted['android.permission.BLUETOOTH_CONNECT'] ===
          'granted' &&
        bluetoothGranted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
        locationGranted === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  // Bluetooth Actions
  const checkBluetoothEnabled = async () => {
    try {
      const isEnabled = await isBluetoothEnabled();
      setBluetoothInfo((prev) => ({ ...prev, isEnabled }));
    } catch (error) {
      console.error('Bluetooth check error:', error);
    }
  };

  const enableBluetooth = async () => {
    try {
      const response = await enabledBluetooth();
      console.log('EnabledBluetooth', response);
      setBluetoothInfo((prev) => ({ ...prev, isEnabled: response }));
    } catch (error) {
      Alert.alert('Error', 'Unable to enable Bluetooth');
    }
  };

  const fetchBondedDevices = async () => {
    try {
      const devices = await getBondedDevices();
      setBluetoothInfo((prev) => ({ ...prev, bondedDevices: devices }));
    } catch (error) {
      Alert.alert('Error', 'Unable to retrieve paired devices');
    }
  };

  const startDeviceDiscovery = async () => {
    try {
      await startDiscovery();
      setBluetoothInfo((prev) => ({
        ...prev,
        discoveryFinished: false,
        discoveryDevices: [],
      }));
    } catch (error) {
      Alert.alert('Error', 'Unable to start discovery');
    }
  };

  const pairWithDevice = async (address: string) => {
    try {
      await pairDevice(address);
      Alert.alert('Success', 'Device paired successfully');
      await fetchBondedDevices();
    } catch (error) {
      Alert.alert('Error', 'Unable to pair the device');
    }
  };

  const connectToDevice = async (address: string) => {
    try {
      await connect(address, { delimiter: '4352', bufferLength: 1024 });
      setBluetoothInfo((prev) => ({ ...prev, isConnected: true }));
    } catch (error) {
      Alert.alert('Error', 'Unable to connect to the device');
    }
  };

  const disconnectFromDevice = async () => {
    try {
      const isDisconnected = await disconnect();
      console.log('disconnect()', isDisconnected);
      setBluetoothInfo((prev) => ({
        ...prev,
        isConnected: false,
        connectedDevice: null,
      }));
    } catch (error) {
      Alert.alert('Error', 'Unable to disconnect from the device');
    }
  };

  const sendCommand = async (data: string) => {
    try {
      await write(data);
    } catch (error) {
      Alert.alert('Error', 'Error sending data: ' + error);
    }
  };

  // Effects
  useEffect(() => {
    const initialize = async () => {
      const hasPermissions = await requestPermissions();
      if (hasPermissions) {
        await checkBluetoothEnabled();
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const listeners = [
      typedBluetoothListener('BluetoothStateChanged', (event) => {
        console.log('BluetoothStateChanged', event);
        setBluetoothInfo((prev) => ({
          ...prev,
          isEnabled: event.state === 'STATE_ON',
          changedState: event.state,
        }));
      }),
      typedBluetoothListener('OnDiscoveryDevice', (event) => {
        setBluetoothInfo((prev) => ({
          ...prev,
          discoveryDevices: [...(prev.discoveryDevices || []), event],
        }));
      }),
      typedBluetoothListener('OnBondedDevice', (event) => {
        console.log('OnBondedDevice', event?.address);
      }),
      typedBluetoothListener('OnDiscoveryFinished', () => {
        console.log('OnDiscoveryFinished');
        setBluetoothInfo((prev) => ({ ...prev, discoveryFinished: true }));
      }),
      typedBluetoothListener('OnActionAclConnected', (event) => {
        console.log('OnActionAclConnected');
        setBluetoothInfo((prev) => ({ ...prev, connectedDevice: event }));
      }),
      typedBluetoothListener('OnActionAclDisconnected', () => {
        console.log('OnActionAclDisconnected');
        setBluetoothInfo((prev) => ({ ...prev, connectedDevice: null }));
      }),
      typedBluetoothListener('OnDataReceived', (event) => {
        console.log('Received data:', event);
      }),
    ];

    return () => listeners.forEach((listener) => listener.remove());
  }, []);

  // Components
  const DeviceCard: React.FC<{
    device: BluetoothDevice;
    onPress: (address: string) => void;
    isConnected?: boolean;
  }> = ({ device, onPress, isConnected }) => (
    <TouchableOpacity
      style={[styles.deviceCard, isConnected && styles.connectedDevice]}
      onPress={() => onPress(device.address)}
    >
      <View>
        <Text style={styles.deviceName}>{device.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceAddress}>{device.address}</Text>
      </View>
      {isConnected && (
        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={disconnectFromDevice}
        >
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const ActionButton: React.FC<{
    title: string;
    onPress: () => void;
    disabled?: boolean;
  }> = ({ title, onPress, disabled }) => (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bluetooth Status</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              Bluetooth:{' '}
              {bluetoothInfo.isEnabled ? '✅ Enabled' : '❌ Disabled'}
            </Text>
            {bluetoothInfo.changedState && (
              <Text style={styles.statusDetails}>
                Last State: {bluetoothInfo.changedState}
              </Text>
            )}
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionGrid}>
            <ActionButton
              title={
                bluetoothInfo.isEnabled
                  ? 'Bluetooth Enabled'
                  : 'Enable Bluetooth'
              }
              onPress={enableBluetooth}
              disabled={bluetoothInfo.isEnabled}
            />
            <ActionButton title="Paired Devices" onPress={fetchBondedDevices} />
            <ActionButton title="Search" onPress={startDeviceDiscovery} />
            <ActionButton
              title="Check Connection"
              onPress={async () => {
                const connected = await isConnected();
                setBluetoothInfo((prev) => ({
                  ...prev,
                  isConnected: connected,
                }));
                Alert.alert('Connection Status', connected ? 'Yes' : 'No');
              }}
            />
          </View>
        </View>

        {/* Command Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commands</Text>
          <View style={styles.commandContainer}>
            <View style={styles.commandButtons}>
              <ActionButton title="ON" onPress={() => sendCommand('ON')} />
              <ActionButton title="OFF" onPress={() => sendCommand('OFF')} />
            </View>
          </View>
        </View>

        {/* Connected Device */}
        {bluetoothInfo.connectedDevice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connected Device</Text>
            <DeviceCard
              device={bluetoothInfo.connectedDevice}
              onPress={() => {}}
              isConnected
            />
          </View>
        )}

        {/* Bonded Devices */}
        {bluetoothInfo.bondedDevices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paired Devices</Text>
            {bluetoothInfo.bondedDevices.map((device) => (
              <DeviceCard
                key={device.address}
                device={device}
                onPress={connectToDevice}
              />
            ))}
          </View>
        )}

        {/* Discovered Devices */}
        {bluetoothInfo.discoveryDevices.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Discovered Devices</Text>
              <TouchableOpacity
                onPress={() =>
                  setBluetoothInfo((prev) => ({
                    ...prev,
                    discoveryDevices: [],
                  }))
                }
              >
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            </View>
            {bluetoothInfo.discoveryDevices.map((device) => (
              <DeviceCard
                key={device.address}
                device={device}
                onPress={pairWithDevice}
              />
            ))}
          </View>
        )}

        {bluetoothInfo.discoveryFinished && (
          <Text style={styles.discoveryStatus}>Discovery Finished</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    minWidth: 150,
  },
  buttonDisabled: {
    backgroundColor: '#99ccff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commandContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  commandInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  commandButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deviceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectedDevice: {
    borderWidth: 1,
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e9',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  deviceAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 8,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  discoveryStatus: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
});

export default App;
