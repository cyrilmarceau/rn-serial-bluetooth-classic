package com.rnserialbluetoothclassic.bluetooth

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.rnserialbluetoothclassic.RnSerialBluetoothClassicModule.Companion.NAME
import com.rnserialbluetoothclassic.connection.ThreadConnection
import com.rnserialbluetoothclassic.event.BluetoothEventEmitter
import com.rnserialbluetoothclassic.exception.BluetoothException
import java.io.IOException
import java.util.UUID


class BluetoothDeviceManager(
    private val eventEmitter: BluetoothEventEmitter,
    private val bluetoothAdapter: BluetoothAdapter?
) {

    private var activeConnection: ThreadConnection? = null
    private var bluetoothSocket: BluetoothSocket? = null
    private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

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
            promise.reject(
                "BLUETOOTH_ERROR",
                "Error during bond new device device: ${e.message}",
                e
            )
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

    @OptIn(ExperimentalStdlibApi::class)
    fun write(data: String, promise: Promise) {
        val connection = activeConnection

        if (connection == null) {
            BluetoothException.DEVICE_CONNECTION_ERROR.reject(promise)
            return
        }

        try {
            val isSend = connection.write(data.hexToByteArray())
            if (isSend) {
                promise.resolve(true)
            } else {
                BluetoothException.DEVICE_WRITE_ERROR.reject(promise)
            }
        } catch (e: Exception) {
            BluetoothException.DEVICE_WRITE_ERROR.reject(promise)
        }

    }

    @RequiresPermission(allOf = [Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_SCAN])
    fun connect(address: String, options: ReadableMap, promise: Promise) {
        if (bluetoothAdapter == null) {
            return BluetoothException.ADAPTER_NULL_ERROR.reject(promise)
        }

        if (!bluetoothAdapter.isEnabled) {
            return BluetoothException.BLUETOOTH_DISABLED_ERROR.reject(promise)
        }

        disconnectIfConnected()

        try {
            val device: BluetoothDevice = bluetoothAdapter.getRemoteDevice(address)

            bluetoothAdapter.cancelDiscovery()

            val socket = device.createRfcommSocketToServiceRecord(SPP_UUID)

            bluetoothSocket = socket

            val connectionThread = ThreadConnection(
                socket = socket,
                device = device,
                options = options,
                eventEmitter = eventEmitter,
                promise = promise
            )
            connectionThread.start()

            activeConnection = connectionThread

        } catch (e: Exception) {
            promise.reject("BLUETOOTH_ERROR", "Error initiating connection: ${e.message}", e)
        }
    }

    fun disconnect(promise: Promise) {
        if (disconnectIfConnected()) {
            promise.resolve(true)
        } else {
            promise.resolve(false)
        }
    }

    private fun disconnectIfConnected(): Boolean {
        try {
            // Cancel the connection thread if it exists
            activeConnection?.let {
                it.cancel()
                return true
            }

            // Close the socket if it exists
            bluetoothSocket?.let {
                try {
                    it.close()
                } catch (e: IOException) {
                    Log.d("SocketThread", "Error closing the Bluetooth socket", e)
                }
            }


            activeConnection = null
            bluetoothSocket = null

            return false
        } catch (e: Exception) {
            Log.d("SocketThread", "Error during disconnect", e)
            return false
        }
    }


    fun isConnected(promise: Promise) {
        try {
            val connected = bluetoothSocket?.isConnected == true && activeConnection != null
            promise.resolve(connected)
        } catch (e: Exception) {
            BluetoothException.DEVICE_CONNECTION_CHECK_ERROR.reject(promise)
        }
    }


}


