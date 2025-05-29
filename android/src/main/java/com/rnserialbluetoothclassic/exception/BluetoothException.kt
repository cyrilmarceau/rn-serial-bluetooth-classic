package com.rnserialbluetoothclassic.exception

import com.facebook.react.bridge.Promise

object BluetoothException {

    const val ADAPTER_NULL = "BLUETOOTH_ADAPTER_NULL"
    const val BLUETOOTH_DISABLED = "BLUETOOTH_DISABLED_ERROR"
    const val ACTIVITY_ACCESS = "ACTIVITY_ACCESS_ERROR"
    const val DEVICE_WRITE = "DEVICE_WRITE_ERROR"
    const val DEVICE_CONNECTION = "DEVICE_CONNECTION_ERROR"
    const val DEVICE_CONNECTION_CHECK = "DEVICE_CONNECTION_CHECK_ERROR"

    data class BluetoothError(
        val code: String,
        val message: String
    ) {

        fun reject(promise: Promise, customMessage: String? = null) {
            promise.reject(code, customMessage ?: message)
        }
    }

    val ADAPTER_NULL_ERROR = BluetoothError(
        ADAPTER_NULL,
        "Bluetooth not available on this device"
    )

    val BLUETOOTH_DISABLED_ERROR = BluetoothError(
        BLUETOOTH_DISABLED,
        "Bluetooth is disabled"
    )

    val ACTIVITY_ACCESS_ERROR = BluetoothError(
        ACTIVITY_ACCESS,
        "Unable to access the current activity"
    )

    val DEVICE_WRITE_ERROR = BluetoothError(
        DEVICE_WRITE,
        "Failed to write data"
    )

    val DEVICE_WRITE_BAD_HEXA_ERROR = BluetoothError(
        DEVICE_WRITE,
        "Failed to write data"
    )

    val DEVICE_CONNECTION_ERROR = BluetoothError(
        DEVICE_CONNECTION,
        "No active Bluetooth connection"
    )

    val DEVICE_CONNECTION_CHECK_ERROR = BluetoothError(
        DEVICE_CONNECTION_CHECK,
        "No active Bluetooth connection"
    )
}
