import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

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

export const BluetoothListeners = {
  BLUETOOTH_STATE_CHANGED: 'BluetoothStateChanged',
} as const;

export type BluetoothListener =
  (typeof BluetoothListeners)[keyof typeof BluetoothListeners];

export interface Spec extends TurboModule {
  multiply(a: number, b: number): number;

  isBluetoothEnabled(): Promise<boolean>;
  enabledBluetooth(): Promise<boolean>;

  addListener(eventName: string): void;
  removeListeners(count: number): void;

  getBondedDevices(): Promise<BluetoothDevice[]>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'RnSerialBluetoothClassic'
);
