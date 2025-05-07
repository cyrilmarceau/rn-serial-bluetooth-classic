import RnSerialBluetoothClassic, {
  type BluetoothListeners,
  type BluetoothResponse,
} from './NativeRnSerialBluetoothClassic';

import { NativeEventEmitter, NativeModules } from 'react-native';

export type BluetoothStateChanged = {
  state: 'STATE_TURNING_ON' | 'STATE_TURNING_OFF' | 'STATE_ON' | 'STATE_OFF';
};
export type BluetoothEventPayloads = {
  [BluetoothListeners.BLUETOOTH_STATE_CHANGED]: BluetoothStateChanged;
};

export const bluetoothListener = new NativeEventEmitter(
  NativeModules.RnSerialBluetoothClassic
);

export function multiply(a: number, b: number): number {
  return RnSerialBluetoothClassic.multiply(a, b);
}

export async function isBluetoothEnabled(): Promise<BluetoothResponse> {
  return await RnSerialBluetoothClassic.isBluetoothEnabled();
}

export async function enabledBluetooth(): Promise<BluetoothResponse> {
  return await RnSerialBluetoothClassic.enabledBluetooth();
}

export function typedBluetoothListener<K extends keyof BluetoothEventPayloads>(
  eventName: K,
  listener: (event: BluetoothEventPayloads[K]) => void
) {
  return bluetoothListener.addListener(eventName, listener);
}
