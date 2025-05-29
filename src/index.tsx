/**
 * Bluetooth Utility Module for React Native
 *
 * This module provides a set of utilities and event listeners for managing Bluetooth Classic (Serial) connections
 * in React Native. It abstracts native Bluetooth APIs, manages paired devices, connection states, and data transfer,
 * and exposes a strongly-typed event system for ease of use.
 *
 * Exports:
 * - BluetoothDevice (type)
 * - BluetoothListeners (event name constants)
 * - BluetoothListener (event name union type)
 * - BluetoothStateChanged (type)
 * - DeviceOnDataReceived (type)
 * - BluetoothEventPayloads (event payload type map)
 * - bluetoothListener (NativeEventEmitter instance)
 * - All main Bluetooth functions: isBluetoothEnabled, enabledBluetooth, getBondedDevices, startDiscovery, pairDevice, connect, disconnect, isConnected, write, typedBluetoothListener.
 */

import RnSerialBluetoothClassic, {
  type BluetoothDevice,
  type DeviceConnectOptions,
} from './NativeRnSerialBluetoothClassic';

import { NativeEventEmitter, NativeModules } from 'react-native';

export { type BluetoothDevice } from './NativeRnSerialBluetoothClassic';

/**
 * Event names for Bluetooth-related events.
 */
export const BluetoothListeners = {
  BLUETOOTH_STATE_CHANGED: 'BluetoothStateChanged',
  ON_DISCOVERY_DEVICE: 'OnDiscoveryDevice',
  ON_DISCOVERY_FINISHED: 'OnDiscoveryFinished',
  ON_BONDED_DEVICE: 'OnBondedDevice',
  ON_ACTION_ACL_CONNECTED: 'OnActionAclConnected',
  ON_ACTION_ACL_DISCONNECTED: 'OnActionAclDisconnected',
  ON_DATA_RECEIVED: 'OnDataReceived',
} as const;

/**
 * Type representing all possible Bluetooth event names.
 */
export type BluetoothListener =
  (typeof BluetoothListeners)[keyof typeof BluetoothListeners];

/**
 * Represents the payload for the BLUETOOTH_STATE_CHANGED event.
 */
export type BluetoothStateChanged = {
  state: 'STATE_TURNING_ON' | 'STATE_TURNING_OFF' | 'STATE_ON' | 'STATE_OFF';
};

/**
 * Represents the payload for ON_DATA_RECEIVED events.
 */
export type DeviceOnDataReceived = {
  address: string;
  data: string;
};

/**
 * Maps Bluetooth event names to their payload types.
 */
export type BluetoothEventPayloads = {
  [BluetoothListeners.BLUETOOTH_STATE_CHANGED]: BluetoothStateChanged;
  [BluetoothListeners.ON_DISCOVERY_DEVICE]: BluetoothDevice;
  [BluetoothListeners.ON_DISCOVERY_FINISHED]: void;
  /**
   * ON_BONDED_DEVICE:
   * - If the pairing activity is cancelled, the event will be `null`.
   * - If the device is already paired, it will emit the device object.
   */
  [BluetoothListeners.ON_BONDED_DEVICE]: BluetoothDevice | null;
  [BluetoothListeners.ON_ACTION_ACL_CONNECTED]: BluetoothDevice | null;
  [BluetoothListeners.ON_ACTION_ACL_DISCONNECTED]: BluetoothDevice | null;
  [BluetoothListeners.ON_DATA_RECEIVED]: DeviceOnDataReceived;
};

export const bluetoothListener = new NativeEventEmitter(
  NativeModules.RnSerialBluetoothClassic
);

/**
 * Checks whether Bluetooth is currently enabled on the device.
 * @returns {Promise<boolean>} True if Bluetooth is enabled, false otherwise.
 */
export async function isBluetoothEnabled(): Promise<boolean> {
  return await RnSerialBluetoothClassic.isBluetoothEnabled();
}

/**
 * Requests the user to enable Bluetooth if it is not already enabled.
 * @returns {Promise<boolean>} Resolves to true if Bluetooth is enabled after the request, false if the user cancels.
 * If Bluetooth was already enabled, resolves to true immediately.
 * Emits BluetoothStateChanged events if the state changes.
 */
export async function enabledBluetooth(): Promise<boolean> {
  return await RnSerialBluetoothClassic.enabledBluetooth();
}

/**
 * Adds a typed listener for a specific Bluetooth event.
 * @param eventName The name of the event to listen for.
 * @param listener The callback to invoke with the event payload.
 * @returns A subscription that can be removed with `.remove()`.
 */
export function typedBluetoothListener<K extends keyof BluetoothEventPayloads>(
  eventName: K,
  listener: (event: BluetoothEventPayloads[K]) => void
) {
  return bluetoothListener.addListener(eventName, listener);
}

/**
 * Retrieves all devices currently paired (bonded) with the device.
 * @returns {Promise<BluetoothDevice[]>} Array of paired Bluetooth devices.
 */
export async function getBondedDevices(): Promise<BluetoothDevice[]> {
  return await RnSerialBluetoothClassic.getBondedDevices();
}

/**
 * Starts scanning for nearby Bluetooth devices for 12 seconds.
 * - Emits `OnDiscoveryDevice` for each found device.
 * - Emits `OnDiscoveryFinished` when the scan is finished.
 * @returns {Promise<void>}
 *
 * Note: You should listen for new devices via the event system.
 * (TODO: Consider returning a list of discovered devices in the future.)
 */
export async function startDiscovery(): Promise<void> {
  return await RnSerialBluetoothClassic.startDiscovery();
}

/**
 * Attempts to pair with a device given its address.
 * - If the device is already paired, emits `OnBondedDevice` with `null`.
 * - On successful pairing, emits `OnBondedDevice` with the device object.
 * @param address The MAC address of the target device.
 * @returns {Promise<void>}
 */
export async function pairDevice(address: string): Promise<void> {
  return await RnSerialBluetoothClassic.pairDevice(address);
}

/**
 * Establishes a connection to a Bluetooth device.
 * - On successful connection, emits `OnActionAclConnected`.
 * - You should register an `OnDataReceived` listener to handle incoming data.
 * @param address The MAC address of the device to connect.
 * @param options Connection options (see DeviceConnectOptions).
 * @returns {Promise<void>}
 */
export async function connect(
  address: string,
  options: DeviceConnectOptions
): Promise<void> {
  return await RnSerialBluetoothClassic.connect(address, options);
}

/**
 * Disconnects from the currently connected Bluetooth device.
 * - On successful disconnected, emits `OnActionAclDisconnected`.
 * @returns {Promise<boolean>}
 */
export async function disconnect(): Promise<boolean> {
  return await RnSerialBluetoothClassic.disconnect();
}

/**
 * Checks if a Bluetooth device is currently connected.
 * @returns {Promise<boolean>} True if connected, false otherwise.
 */
export async function isConnected(): Promise<boolean> {
  return await RnSerialBluetoothClassic.isConnected();
}

/**
 * Writes data to the connected Bluetooth device.
 * @param data Hexadecimal string to send.
 * @returns {Promise<boolean>} True if the data was written successfully, false otherwise.
 */
export async function write(data: string): Promise<boolean> {
  return await RnSerialBluetoothClassic.write(data);
}
