package com.rnserialbluetoothclassic.utils

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.rnserialbluetoothclassic.domain.BluetoothResponse

fun resolveBluetoothPromise(promise: Promise, success: Boolean, message: String, data: WritableMap? = null) {
  val response = BluetoothResponse(success, message, data).toWriteableMap()
  promise.resolve(response)
}
