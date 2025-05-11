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
  getBondedDevices,
  isBluetoothEnabled,
  typedBluetoothListener,
  type BluetoothStateChanged,
  type BluetoothDevice,
  startDiscovery,
  pairDevice,
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

  const requestLocationPermission = async () => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'Location permission is required to use Bluetooth.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const checkBluetoothEnabled = async () => {
    try {
      const isEnabled = await isBluetoothEnabled();
      setBluetoothInfo((prev) => ({
        ...(prev ?? {}),
        isEnabled: isEnabled,
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
        isEnabled: response,
      }));
      console.log('Enable Bluetooth:', response);
    } catch (error) {
      console.error('Error enabling Bluetooth:', error);
    }
  };

  const onGetBondedDevices = async () => {
    try {
      const devices = await getBondedDevices();
      setBluetoothInfo((prev) => ({
        ...(prev ?? {}),
        bondedDevices: devices,
      }));
      console.log('onGetBondedDevices :: ', devices);
    } catch (error) {
      console.error('Error getting bonded devices:', error);
    }
  };

  const onStartDiscovery = async () => {
    try {
      await startDiscovery();
      console.log('Discovery started');
    } catch (error) {
      console.error('Error starting discovery:', error);
    }
  };

  const onPairDevice = async (address: string) => {
    try {
      const device = await pairDevice(address);
      console.log('Device paired:', device);
    } catch (error) {
      console.error('Error pairing device:', error);
    }
  };

  React.useEffect(() => {
    requestBluetoothPermission();
    checkBluetoothEnabled();
    requestLocationPermission();

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

  React.useEffect(() => {
    const sb = typedBluetoothListener('OnDiscoveryDevice', (event) => {
      console.log('OnDiscoveryDevice::event::', event.address);
      setBluetoothInfo((prev) => ({
        ...(prev ?? {}),
        discoveryDevices: [...(prev?.discoveryDevices ?? []), { ...event }],
      }));
    });

    const sbFinished = typedBluetoothListener('OnDiscoveryFinished', () => {
      setBluetoothInfo((prev) => ({
        ...(prev ?? {}),
        discoveryFinished: true,
      }));
    });

    const sbPaired = typedBluetoothListener('OnBondedDevice', (device) => {
      console.log('OnBondedDevice::event::', device);
      // setBluetoothInfo((prev) => ({
      //   ...(prev ?? {}),
      //   discoveryDevices: prev?.discoveryDevices?.filter(
      //     (device) => device.address !== event.address
      //   ),
      //   bondedDevices: [...(prev?.bondedDevices ?? []), { ...event }],
      // }));
      // console.log('Bonded devices:', bluetoothInfo.bondedDevices);
    });

    return () => {
      sb.remove();
      sbFinished.remove();
      sbPaired.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Button title="Enable Bluetooth" onPress={onEnableBluetooth} />
        <View style={styles.divider} />
        <Button title="Get bonded devices" onPress={onGetBondedDevices} />
        <View style={styles.divider} />
        <Button title="Start discovery" onPress={onStartDiscovery} />
      </View>
      <ScrollView>
        <View style={styles.divider} />
        <Text>
          Has bluetooth enabled: {bluetoothInfo.isEnabled ? 'Yes' : 'No'}
        </Text>
        {bluetoothInfo.changedState && (
          <Text>Last state change: {bluetoothInfo.changedState}</Text>
        )}
        <View style={styles.divider} />

        {bluetoothInfo.bondedDevices
          ? bluetoothInfo.bondedDevices.length > 0 && (
              <>
                <Text>Bonded Devices: </Text>
                {bluetoothInfo.bondedDevices.map((device) => (
                  <React.Fragment key={device.address}>
                    <Button
                      key={device.address}
                      title={device.name ?? device.address}
                      onPress={() => {}}
                    />
                    <View style={styles.divider} />
                  </React.Fragment>
                ))}
              </>
            )
          : null}

        {bluetoothInfo.discoveryDevices &&
          bluetoothInfo.discoveryDevices.length > 0 && (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <Text>Discovery Devices: </Text>
                <Button
                  title="Clear local devices"
                  onPress={() => {
                    setBluetoothInfo((prev) => ({
                      ...(prev ?? {}),
                      discoveryDevices: [],
                    }));
                  }}
                />
              </View>
              {bluetoothInfo.discoveryDevices.map((device) => (
                <React.Fragment key={device.address}>
                  <Button
                    key={device.address}
                    title={`Appaired: ${device.name ?? device.address}`}
                    onPress={() => onPairDevice(device.address)}
                  />
                  <View style={styles.divider} />
                </React.Fragment>
              ))}
            </>
          )}

        {bluetoothInfo.discoveryFinished && <Text>Discovery finished</Text>}
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
  divider: {
    width: '100%',
    backgroundColor: '#000',
    marginVertical: 5,
  },
});
