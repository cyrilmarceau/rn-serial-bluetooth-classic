import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type DeviceConnectOptions = {
  /**
   * If no delimiter was set the default value is set
   * If you don't want delimiter pass explicitly empty string for received all chunks
   * @default "\n"
   */
  delimiter: string | null;

  /**
   * Delimit the size of buffer
   * @default 1024
   */
  bufferLength: number;
};

export interface BluetoothDevice {
  /**
   * Get the friendly Bluetooth name of the remote device.
   */
  name: string;
  /**
   * Returns the hardware address of this BluetoothDevice.
   * For example, "00:11:22:AA:BB:CC".
   */
  address: string;
  /**
   * Indicates the remote device is bonded (paired).
   */
  isBonded: boolean;

  /**
   * Get the locally modifiable name (alias) of the remote Bluetooth device.
   * It requires the BLUETOOTH_ADMIN permission and is only available for SDK > R (30).
   */
  alias?: string;

  /**
   * https://developer.android.com/reference/android/bluetooth/BluetoothDevice#getAddressType()
   * Only available for SDK > VANILLA_ICE_CREAM (35).
   * If SDK < 35, it will return -1.
   */
  addressType: number;

  bluetoothClass: {
    /**
     * The major device class.
     * For example, "PHONE".
     * https://developer.android.com/reference/android/bluetooth/BluetoothClass#getMajorDeviceClass()
     */
    majorDeviceClass: string;

    /**
     * The major device class.
     * For example, "PHONE".
     * https://developer.android.com/reference/android/bluetooth/BluetoothClass#getDeviceClass()
     */
    deviceClass: string;
  };

  /**
   * Get the Bluetooth device type of the remote device.
   * the device type DEVICE_TYPE_CLASSIC, DEVICE_TYPE_LE DEVICE_TYPE_DUAL. DEVICE_TYPE_UNKNOWN if it's not available
   * https://developer.android.com/reference/android/bluetooth/BluetoothDevice#getType()
   */
  type: number;
}

export interface Spec extends TurboModule {
  isBluetoothEnabled(): Promise<boolean>;

  enabledBluetooth(): Promise<boolean>;

  addListener(eventName: string): void;
  removeListeners(count: number): void;

  getBondedDevices(): Promise<BluetoothDevice[]>;

  startDiscovery(): Promise<void>;

  /**
   *
   * @param address The address of the device to pair with.
   * Subscribe to the `BluetoothListeners.ON_BONDED_DEVICE` event to get the result of the pairing.
   * @returns A promise that resolves when the pairing is complete.
   */
  pairDevice(address: string): Promise<void>;

  /**
   * Connect device from his address
   * Pass an object in options
   */
  connect(address: string, options: DeviceConnectOptions): Promise<void>;

  /**
   * Disconnect connected device
   */
  disconnect(): Promise<boolean>;

  /**
   * Check if device is currently connected
   */
  isConnected(): Promise<boolean>;

  /**
   * Send data to connected device
   * If data is not on hexadecimal format it return an exception
   * @param data
   */
  write(data: string): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'RnSerialBluetoothClassic'
);
