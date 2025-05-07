import RnSerialBluetoothClassic, {
  type BluetoothResponse,
} from './NativeRnSerialBluetoothClassic';

export function multiply(a: number, b: number): number {
  return RnSerialBluetoothClassic.multiply(a, b);
}

export async function isBluetoothEnabled(): Promise<BluetoothResponse> {
  return await RnSerialBluetoothClassic.isBluetoothEnabled();
}

export async function enabledBluetooth(): Promise<BluetoothResponse> {
  return await RnSerialBluetoothClassic.enabledBluetooth();
}
