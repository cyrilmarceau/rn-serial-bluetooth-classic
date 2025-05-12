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
} from 'react-native';
import {
  enabledBluetooth,
  getBondedDevices,
  isBluetoothEnabled,
  typedBluetoothListener,
  type BluetoothStateChanged,
  type BluetoothDevice,
  startDiscovery,
  pairDevice,
  connect,
} from 'rn-serial-bluetooth-classic';

interface BluetoothInfo {
  isEnabled: boolean;
  changedState?: BluetoothStateChanged['state'];
  bondedDevices?: BluetoothDevice[];
  discoveryDevices?: BluetoothDevice[];
  discoveryFinished?: boolean;
}

export default function App() {
  const [bluetoothInfo, setBluetoothInfo] = React.useState<BluetoothInfo>({
    isEnabled: false,
    bondedDevices: [],
  });
  const [isLoading, setIsLoading] = React.useState(false);

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
    setIsLoading(true);
    try {
      const response = await enabledBluetooth();
      setBluetoothInfo((prev) => ({
        ...prev,
        isEnabled: response,
      }));
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'activer le Bluetooth");
    } finally {
      setIsLoading(false);
    }
  };

  const onGetBondedDevices = async () => {
    setIsLoading(true);
    try {
      const devices = await getBondedDevices();
      setBluetoothInfo((prev) => ({
        ...prev,
        bondedDevices: devices,
      }));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer les appareils appairés');
    } finally {
      setIsLoading(false);
    }
  };

  const onStartDiscovery = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const onPairDevice = async (address: string) => {
    setIsLoading(true);
    try {
      const device = await pairDevice(address);
      Alert.alert(
        'Succès',
        `Appareil appairé: ${device.name || device.address}`
      );
      await onGetBondedDevices();
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'appairer l'appareil");
    } finally {
      setIsLoading(false);
    }
  };

  const onConnectDevice = async (address: string) => {
    setIsLoading(true);
    try {
      const device = await connect(address);
      console.log('Appareil connecté:', device);
    } catch (error) {
      Alert.alert('Erreur', "Impossible de se connecter à l'appareil");
    } finally {
      setIsLoading(false);
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
        setIsLoading(false);
      }),
    ];

    // Cleanup function qui supprime tous les listeners
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
      disabled={isLoading}
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
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={onEnableBluetooth}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {bluetoothInfo.isEnabled
                ? 'Bluetooth activé'
                : 'Activer Bluetooth'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={onGetBondedDevices}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Appareils appairés</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={onStartDiscovery}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Rechercher des appareils</Text>
          </TouchableOpacity>
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
                disabled={isLoading}
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
});
