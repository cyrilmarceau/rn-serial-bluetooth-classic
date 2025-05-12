package com.rnserialbluetoothclassic.extension

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

@SuppressLint("MissingPermission")
fun BluetoothDevice.toWritableMap(): WritableMap {
  val params = Arguments.createMap().apply {
    putString("name", this@toWritableMap.name)
    putString("address", this@toWritableMap.address)
    putBoolean("isBonded", this@toWritableMap.bondState == BluetoothDevice.BOND_BONDED)

    putString("alias", this@toWritableMap.let { it ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        it.alias
      } else null
    })

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      putInt("addressType", this@toWritableMap.addressType)
    } else {
      putInt("addressType", -1)
    }

    this@toWritableMap.bluetoothClass.let {
      val bluetoothClass = Arguments.createMap()
      bluetoothClass.putInt("majorDeviceClass", it.majorDeviceClass)
      bluetoothClass.putInt("deviceClass", it.deviceClass)
      putMap("bluetoothClass", bluetoothClass)
    }

    putInt("type",  this@toWritableMap.type)
  }

  return params
}
