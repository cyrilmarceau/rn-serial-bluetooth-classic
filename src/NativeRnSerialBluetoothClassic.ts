import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface BluetoothResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export const BluetoothListeners = {
  BLUETOOTH_STATE_CHANGED: 'BluetoothStateChanged',
} as const;

export type BluetoothListener =
  (typeof BluetoothListeners)[keyof typeof BluetoothListeners];

export interface Spec extends TurboModule {
  multiply(a: number, b: number): number;

  isBluetoothEnabled(): Promise<BluetoothResponse>;
  enabledBluetooth(): Promise<BluetoothResponse>;

  addListener(eventName: string): void;
  removeListeners(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'RnSerialBluetoothClassic'
);
