import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface BluetoothResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface Spec extends TurboModule {
  multiply(a: number, b: number): number;

  isBluetoothEnabled(): Promise<BluetoothResponse>;
  enabledBluetooth(): Promise<BluetoothResponse>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'RnSerialBluetoothClassic'
);
