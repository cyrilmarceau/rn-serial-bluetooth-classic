package com.rnserialbluetoothclassic.bluetooth

import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.content.Context
import android.content.Intent
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

import com.rnserialbluetoothclassic.exception.BluetoothException

class BluetoothAdapterManager(private val context: ReactApplicationContext) {
  private val bluetoothAdapter by lazy {
    BluetoothAdapter.getDefaultAdapter()
  }

  private var bluetoothPromise: Promise? = null

  fun isBluetoothEnabled(promise: Promise) {
    if (bluetoothAdapter == null) {
      BluetoothException.ADAPTER_NULL_ERROR.reject(promise)
      return
    }
    promise.resolve(bluetoothAdapter.isEnabled)
  }

  fun getAdapter(): BluetoothAdapter? {
    return bluetoothAdapter
  }

  @RequiresPermission(android.Manifest.permission.BLUETOOTH_CONNECT)
  fun enableBluetooth(promise: Promise) {
    if (bluetoothAdapter == null) {
      BluetoothException.ADAPTER_NULL_ERROR.reject(promise)
      return
    }

    if (bluetoothAdapter.isEnabled) {
      promise.resolve(true)
      return
    }

    try {
      val enableIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)

      val activity = context.currentActivity
      if (activity == null) {
        BluetoothException.ACTIVITY_ACCESS_ERROR.reject(promise)
        return
      }

      bluetoothPromise = promise
      activity.startActivityForResult(enableIntent, 1)

    } catch (e: Exception) {

      promise.reject(
        "BLUETOOTH_ERROR",
        "Error while requesting Bluetooth activation: ${e.message}"
      )
    }
  }

  fun registerBluetoothActivityEventListener() {
    val listener = object : BaseActivityEventListener() {
      override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
      ) {
        if (requestCode != 1) return

        bluetoothPromise?.let { promise ->
          val (success, message) = when (resultCode) {
            Activity.RESULT_OK -> true to "User accepted to enable Bluetooth"
            Activity.RESULT_CANCELED -> false to "User denied enabling Bluetooth"
            else -> false to "Unexpected result code"
          }

          promise.resolve(success)
          bluetoothPromise = null
        }
      }
    }

    context.addActivityEventListener(listener)
  }

  fun cleanup(){
    bluetoothPromise = null
  }




}
