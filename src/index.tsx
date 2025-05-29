import RnSerialBluetoothClassic, {
  type BluetoothDevice,
  type BluetoothListeners,
  type DeviceConnectOptions,
} from './NativeRnSerialBluetoothClassic';

import { NativeEventEmitter, NativeModules } from 'react-native';

export { type BluetoothDevice } from './NativeRnSerialBluetoothClassic';

export type BluetoothStateChanged = {
  state: 'STATE_TURNING_ON' | 'STATE_TURNING_OFF' | 'STATE_ON' | 'STATE_OFF';
};

export type DeviceOnDataReceived = {
  address: string;
  data: string;
};

export type BluetoothEventPayloads = {
  [BluetoothListeners.BLUETOOTH_STATE_CHANGED]: BluetoothStateChanged;
  [BluetoothListeners.ON_DISCOVERY_DEVICE]: BluetoothDevice;
  [BluetoothListeners.ON_DISCOVERY_FINISHED]: void;

  /**
   * If activity is cancel it will return null.
   * If the device is already bonded, it will return the device.
   */
  [BluetoothListeners.ON_BONDED_DEVICE]: BluetoothDevice | null;
  [BluetoothListeners.ON_ACTION_ACL_CONNECTED]: BluetoothDevice | null;
  [BluetoothListeners.ON_ACTION_ACL_DISCONNECTED]: BluetoothDevice | null;
  [BluetoothListeners.ON_DATA_RECEIVED]: DeviceOnDataReceived;
};

export const bluetoothListener = new NativeEventEmitter(
  NativeModules.RnSerialBluetoothClassic
);

export function multiply(a: number, b: number): number {
  return RnSerialBluetoothClassic.multiply(a, b);
}

export async function isBluetoothEnabled(): Promise<boolean> {
  return await RnSerialBluetoothClassic.isBluetoothEnabled();
}

export async function enabledBluetooth(): Promise<boolean> {
  return await RnSerialBluetoothClassic.enabledBluetooth();
}

export function typedBluetoothListener<K extends keyof BluetoothEventPayloads>(
  eventName: K,
  listener: (event: BluetoothEventPayloads[K]) => void
) {
  return bluetoothListener.addListener(eventName, listener);
}

export async function getBondedDevices(): Promise<BluetoothDevice[]> {
  return await RnSerialBluetoothClassic.getBondedDevices();
}

export async function startDiscovery(): Promise<void> {
  return await RnSerialBluetoothClassic.startDiscovery();
}

export async function pairDevice(address: string): Promise<void> {
  return await RnSerialBluetoothClassic.pairDevice(address);
}

export async function connect(
  address: string,
  options: DeviceConnectOptions
): Promise<void> {
  return await RnSerialBluetoothClassic.connect(address, options);
}

export async function disconnect(): Promise<void> {
  return await RnSerialBluetoothClassic.disconnect();
}

export async function isConnected(): Promise<boolean> {
  return await RnSerialBluetoothClassic.isConnected();
}

export async function write(data: string): Promise<boolean> {
  return await RnSerialBluetoothClassic.write(data);
}
