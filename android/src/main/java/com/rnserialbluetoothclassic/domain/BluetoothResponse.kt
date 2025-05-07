package com.rnserialbluetoothclassic.domain

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

data class BluetoothResponse(val success: Boolean, val message: String, val data: WritableMap? = null){
  fun toWriteableMap(): WritableMap {
    val map = Arguments.createMap()
    map.putBoolean("success", success)
    map.putString("message", message)
    map.putMap("data", data)
    return map
  }
}
