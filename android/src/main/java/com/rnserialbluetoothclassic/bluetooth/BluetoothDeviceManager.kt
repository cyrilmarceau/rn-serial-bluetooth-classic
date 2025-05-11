package com.rnserialbluetoothclassic.bluetooth

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.rnserialbluetoothclassic.RnSerialBluetoothClassicModule.Companion.NAME
import com.rnserialbluetoothclassic.event.BluetoothEventEmitter
import com.rnserialbluetoothclassic.exception.BluetoothException
import kotlin.collections.forEach


class BluetoothDeviceManager(
  private val eventEmitter: BluetoothEventEmitter,
  private val bluetoothAdapter: BluetoothAdapter?
) {

  @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
  fun pairDevice(address: String, promise: Promise) {
    Log.d("PairDevice", "pairDevice()")

    if (bluetoothAdapter == null) {
      return BluetoothException.ADAPTER_NULL_ERROR.reject(promise)
    }

    if (!bluetoothAdapter.isEnabled) {
      return BluetoothException.BLUETOOTH_DISABLED_ERROR.reject(promise)
    }

    Log.d("PairDevice", "bond receiver registered")
    try {
      val device: BluetoothDevice = bluetoothAdapter.getRemoteDevice(address)

      if (device.bondState == BluetoothDevice.BOND_BONDED) {
        eventEmitter.emitBondChanged(null)
        return
      }
      device.createBond()

    } catch (e: Exception) {
      promise.reject("BLUETOOTH_ERROR", "Error during bond new device device: ${e.message}", e)
    }
  }

  @RequiresPermission(Manifest.permission.BLUETOOTH_SCAN)
  fun startDiscovery(promise: Promise) {
    if (bluetoothAdapter == null) {
      return BluetoothException.ADAPTER_NULL_ERROR.reject(promise)
    }

    if (!bluetoothAdapter.isEnabled) {
      return BluetoothException.BLUETOOTH_DISABLED_ERROR.reject(promise)
    }

    try {
      // If a current discovery is started, cancel it
      if (bluetoothAdapter.isDiscovering) {
        bluetoothAdapter.cancelDiscovery()
      }

      val hasSuccessfullyStarted = bluetoothAdapter.startDiscovery()

      promise.resolve(hasSuccessfullyStarted)


    } catch (e: Exception) {
      Log.e(NAME, "Failed to register Bluetooth state receiver", e)
      promise.reject(e)
    }
  }

  @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
  fun getBondedDevices(promise: Promise) {
    if (bluetoothAdapter == null) {
      return BluetoothException.ADAPTER_NULL_ERROR.reject(promise)
    }

    if (!bluetoothAdapter.isEnabled) {
      return BluetoothException.BLUETOOTH_DISABLED_ERROR.reject(promise)
    }

    try {
      val pairedDevices: Set<BluetoothDevice>? = bluetoothAdapter.bondedDevices
      val bondedDevices = Arguments.createArray()

      pairedDevices?.forEach { device ->
        val dMap = Arguments.createMap()
        dMap.putString("name", device.name)
        dMap.putString("address", device.address)
        dMap.putBoolean("isBonded", device.bondState == BluetoothDevice.BOND_BONDED)

        dMap.putString("alias", device.let { it ->
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            it.alias
          } else null
        })

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
          dMap.putInt("addressType", device.addressType)
        } else {
          dMap.putInt("addressType", -1)
        }

        device.bluetoothClass.let {
          val bluetoothClass = Arguments.createMap()
          bluetoothClass.putInt("majorDeviceClass", it.majorDeviceClass)
          bluetoothClass.putInt("deviceClass", it.deviceClass)
          dMap.putMap("bluetoothClass", bluetoothClass)
        }
        dMap.putInt("type", device.type)

        bondedDevices.pushMap(dMap)
      }

      promise.resolve(bondedDevices)
    } catch (e: Exception) {
      promise.reject("BLUETOOTH_ERROR", "Error getting bonded devices: ${e.message}", e)
    }
  }
}
