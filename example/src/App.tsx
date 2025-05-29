import React from 'react';
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
  TextInput,
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
  bondedDevices?: BluetoothDevice[];
  discoveryDevices?: BluetoothDevice[];
  discoveryFinished?: boolean;
  connectedDevice?: BluetoothDevice | null;
  isConnected: boolean;
}

export default function App() {
  const [bluetoothInfo, setBluetoothInfo] = React.useState<BluetoothInfo>({
    isEnabled: false,
    bondedDevices: [],
    isConnected: false,
  });

  const requestBluetoothPermission = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);

      return (
        granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
        granted['android.permission.BLUETOOTH_SCAN'] === 'granted'
      );
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permission de localisation',
          message: 'La localisation est nécessaire pour utiliser le Bluetooth.',
          buttonNeutral: 'Plus tard',
          buttonNegative: 'Annuler',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  };

  const checkBluetoothEnabled = async () => {
    try {
      const isEnabled = await isBluetoothEnabled();
      setBluetoothInfo((prev) => ({
        ...prev,
        isEnabled: isEnabled,
      }));
    } catch (error) {
      console.error('Bluetooth check error:', error);
    }
  };

  const onEnableBluetooth = async () => {
    try {
      const response = await enabledBluetooth();
      setBluetoothInfo((prev) => ({
        ...prev,
        isEnabled: response,
      }));
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'activer le Bluetooth");
    } finally {
    }
  };

  const onGetBondedDevices = async () => {
    try {
      const devices = await getBondedDevices();
      setBluetoothInfo((prev) => ({
        ...prev,
        bondedDevices: devices,
      }));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer les appareils appairés');
    } finally {
    }
  };

  const onStartDiscovery = async () => {
    try {
      await startDiscovery();
      setBluetoothInfo((prev) => ({
        ...prev,
        discoveryFinished: false,
        discoveryDevices: [],
      }));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer la recherche');
    } finally {
    }
  };

  const onPairDevice = async (address: string) => {
    try {
      const device = await pairDevice(address);
      Alert.alert('Succès', `Appareil appairé: ${device}`);
      await onGetBondedDevices();
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'appairer l'appareil");
    } finally {
    }
  };

  const onConnectDevice = async (address: string) => {
    try {
      const device = await connect(address, {
        delimiter: '4352',
        bufferLength: 1024,
      });
      console.log('Appareil connecté:', device);
    } catch (error) {
      Alert.alert('Erreur', "Impossible de se connecter à l'appareil");
    } finally {
    }
  };

  const onDisconnectDevice = async () => {
    try {
      await disconnect();
    } catch (error) {
      Alert.alert('Erreur', "Impossible de se déconnecter de l'appareil");
    } finally {
    }
  };

  const checkConnectedDevice = async () => {
    try {
      const payload = await isConnected();
      setBluetoothInfo((prev) => ({
        ...prev,
        isConnected: payload,
      }));
    } catch (error) {
      console.log('An error occured');
    }
  };

  const onWriteData = async (data: string) => {
    try {
      const isSend = await write(data);
      console.log('isSend', isSend);
    } catch (error) {
      console.log('An error occured during send data', error);
    }
  };

  React.useEffect(() => {
    const initialize = async () => {
      const hasPermissions = await requestBluetoothPermission();
      const hasLocation = await requestLocationPermission();
      if (hasPermissions && hasLocation) {
        await checkBluetoothEnabled();
      }
    };
    initialize();
  }, []);

  React.useEffect(() => {
    const listeners = [
      typedBluetoothListener('BluetoothStateChanged', (event) => {
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

      typedBluetoothListener('OnDiscoveryFinished', () => {
        setBluetoothInfo((prev) => ({
          ...prev,
          discoveryFinished: true,
        }));
      }),

      typedBluetoothListener('OnActionAclConnected', (event) => {
        console.log('Appareil connecté:', event);
        setBluetoothInfo((prev) => ({
          ...prev,
          connectedDevice: event,
        }));
      }),
      typedBluetoothListener('OnActionAclDisconnected', (event) => {
        console.log('Appareil déconnecté:', event);
        setBluetoothInfo((prev) => ({
          ...prev,
          connectedDevice: null,
        }));
      }),
      typedBluetoothListener('OnDataReceived', (event) => {
        console.log('Received data', event);
      }),
    ];

    return () => {
      listeners.forEach((listener) => listener.remove());
    };
  }, []);

  const renderDevice = (
    device: BluetoothDevice,
    onPress: (address: string) => void
  ) => (
    <TouchableOpacity
      key={device.address}
      style={styles.deviceContainer}
      onPress={() => onPress(device.address)}
    >
      <View>
        <Text style={styles.deviceName}>
          {device.name || 'Appareil inconnu'}
        </Text>
        <Text style={styles.deviceAddress}>{device.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Bluetooth: {bluetoothInfo.isEnabled ? '✅ Activé' : '❌ Désactivé'}
          </Text>
          {bluetoothInfo.changedState && (
            <Text style={styles.statusDetails}>
              Dernier état: {bluetoothInfo.changedState}
            </Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.button]} onPress={onEnableBluetooth}>
            <Text style={styles.buttonText}>
              {bluetoothInfo.isEnabled
                ? 'Bluetooth activé'
                : 'Activer Bluetooth'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button]}
            onPress={onGetBondedDevices}
          >
            <Text style={styles.buttonText}>Appareils appairés</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button]} onPress={onStartDiscovery}>
            <Text style={styles.buttonText}>Rechercher des appareils</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button]}
            onPress={checkConnectedDevice}
          >
            <Text style={styles.buttonText}>Vérifier connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button]}
            onPress={() => onWriteData('')}
          >
            <Text style={styles.buttonText}>ON</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button]}
            onPress={() => onWriteData('')}
          >
            <Text style={styles.buttonText}>OFF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vérification manuel</Text>
            <Text style={styles.sectionTitle}>
              {bluetoothInfo.isConnected ? '✅ Oui' : '❌ Non'}
            </Text>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trame</Text>
            <TextInput value="cz" />
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Appareil connecté</Text>
          </View>
          <View style={[styles.deviceContainer, styles.connectedDevice]}>
            <View>
              <Text style={styles.deviceName}>
                {bluetoothInfo.connectedDevice?.name || 'Appareil inconnu'}
              </Text>
              <Text style={styles.deviceAddress}>
                {bluetoothInfo.connectedDevice?.address}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onDisconnectDevice}
              style={styles.disconnectButton}
            >
              <Text style={styles.disconnectButtonText}>Déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {bluetoothInfo.bondedDevices?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appareils appairés</Text>
            {bluetoothInfo.bondedDevices.map((device) =>
              renderDevice(device, onConnectDevice)
            )}
          </View>
        ) : null}

        {bluetoothInfo.discoveryDevices?.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Appareils découverts</Text>
              <TouchableOpacity
                onPress={() => {
                  setBluetoothInfo((prev) => ({
                    ...prev,
                    discoveryDevices: [],
                  }));
                }}
              >
                <Text style={styles.clearButton}>Effacer</Text>
              </TouchableOpacity>
            </View>
            {bluetoothInfo.discoveryDevices.map((device) =>
              renderDevice(device, onPairDevice)
            )}
          </View>
        ) : null}

        {bluetoothInfo.discoveryFinished && (
          <Text style={styles.discoveryStatus}>Recherche terminée</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  statusContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    gap: 8,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  clearButton: {
    color: '#007AFF',
    fontSize: 14,
  },
  deviceContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  discoveryStatus: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
  connectedDevice: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
