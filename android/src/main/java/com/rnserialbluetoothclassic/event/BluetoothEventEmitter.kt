package com.rnserialbluetoothclassic.event

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.rnserialbluetoothclassic.RnSerialBluetoothClassicModule.Companion.NAME
import com.rnserialbluetoothclassic.extension.toWritableMap

class BluetoothEventEmitter(private val reactContext: ReactApplicationContext) {
    fun emitDiscoveryChanged(device: BluetoothDevice) {
        try {
            if (ActivityCompat.checkSelfPermission(
                    reactContext,
                    Manifest.permission.BLUETOOTH_CONNECT
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                return
            }

            val params = Arguments.createMap().apply {
                putString("name", device.name)
                putString("address", device.address)
                putBoolean("isBonded", device.bondState == BluetoothDevice.BOND_BONDED)

                putString("alias", device.let { it ->
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        it.alias
                    } else null
                })

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
                    putInt("addressType", device.addressType)
                } else {
                    putInt("addressType", -1)
                }

                device.bluetoothClass.let {
                    val bluetoothClass = Arguments.createMap()
                    bluetoothClass.putInt("majorDeviceClass", it.majorDeviceClass)
                    bluetoothClass.putInt("deviceClass", it.deviceClass)
                    putMap("bluetoothClass", bluetoothClass)
                }
                putInt("type", device.type)
            }

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EventNames.ON_DISCOVERY_DEVICE, params)
        } catch (e: Exception) {
            Log.e(NAME, "Failed to emit new devices on event", e)
        }
    }

    fun emitDiscoveryFinished() {
        val params = Arguments.createMap()
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EventNames.ON_DISCOVERY_FINISHED, params)
    }

    fun emitStateChanged(state: Int) {
        try {
            val params = Arguments.createMap().apply {
                val stateString = when (state) {
                    BluetoothAdapter.STATE_OFF -> "STATE_OFF"
                    BluetoothAdapter.STATE_TURNING_OFF -> "STATE_TURNING_OFF"
                    BluetoothAdapter.STATE_ON -> "STATE_ON"
                    BluetoothAdapter.STATE_TURNING_ON -> "STATE_TURNING_ON"
                    else -> "UNKNOWN"
                }

                putString("state", stateString)
            }

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EventNames.BLUETOOTH_STATE_CHANGED, params)
        } catch (e: Exception) {
            Log.e(NAME, "Failed to emit Bluetooth state event", e)
        }
    }

    @androidx.annotation.RequiresPermission(android.Manifest.permission.BLUETOOTH_CONNECT)
    fun emitBondChanged(device: BluetoothDevice?) {
        Log.d("PairDevice", "Bond state changed: device=${device?.address}")

        if (device == null) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EventNames.ON_BONDED_DEVICE, null)

            return
        }
        try {
            val params = Arguments.createMap().apply {
                putString("name", device.name)
                putString("address", device.address)
                putBoolean("isBonded", device.bondState == BluetoothDevice.BOND_BONDED)

                putString("alias", device.let { it ->
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        it.alias
                    } else null
                })

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
                    putInt("addressType", device.addressType)
                } else {
                    putInt("addressType", -1)
                }

                device.bluetoothClass.let {
                    val bluetoothClass = Arguments.createMap()
                    bluetoothClass.putInt("majorDeviceClass", it.majorDeviceClass)
                    bluetoothClass.putInt("deviceClass", it.deviceClass)
                    putMap("bluetoothClass", bluetoothClass)
                }
                putInt("type", device.type)
            }

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EventNames.ON_BONDED_DEVICE, params)
        } catch (e: Exception) {
            Log.e(NAME, "Failed to emit new devices on event", e)
        }
    }

    fun emitActionACLConnected(device: BluetoothDevice?) {
        Log.d("Debug", "${device?.toWritableMap()}")
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EventNames.ON_ACTION_ACL_CONNECTED, device?.toWritableMap())
    }

    fun emitActionACLDisconnected(device: BluetoothDevice?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EventNames.ON_ACTION_ACL_DISCONNECTED, device?.toWritableMap())
    }

    fun emitDataReceived(address: String, data: String) {
        val params = Arguments.createMap()
        params.putString("address", address)
        params.putString("data", data)

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EventNames.ON_DATA_RECEIVED, params)
    }

}
