package com.rnserialbluetoothclassic.exception

import com.facebook.react.bridge.Promise

object BluetoothException {

  const val ADAPTER_NULL = "BLUETOOTH_ADAPTER_NULL"
  const val BLUETOOTH_DISABLED = "BLUETOOTH_DISABLED_ERROR"
  const val ACTIVITY_ACCESS = "ACTIVITY_ACCESS_ERROR"

  data class BluetoothError(
    val code: String,
    val message: String
  ) {

    fun reject(promise: Promise) {
      promise.reject(code, message)
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
}
