package com.rnserialbluetoothclassic

import android.Manifest
import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Intent
import android.content.IntentFilter
import android.util.Log
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.rnserialbluetoothclassic.domain.BluetoothResponse
import com.rnserialbluetoothclassic.domain.EventNames
import com.rnserialbluetoothclassic.receivers.ActionStateChangedReceiver
import com.rnserialbluetoothclassic.utils.resolveBluetoothPromise

@ReactModule(name = RnSerialBluetoothClassicModule.NAME)
class RnSerialBluetoothClassicModule(reactContext: ReactApplicationContext) :
  NativeRnSerialBluetoothClassicSpec(reactContext), ActionStateChangedReceiver.BluetoothStateChangeListener, LifecycleEventListener {

  override fun getName(): String {
    return NAME
  }

  private var bluetoothPromise: Promise? = null
  private val bluetoothManager by lazy {
    reactApplicationContext.getSystemService(BluetoothManager::class.java)
  }

  private val bluetoothAdapter by lazy {
    bluetoothManager?.adapter
  }

  /**
   * Boolean for register and unregister listener and avoid duplicate value
   * Used in [registerBluetoothActionStateChangedEventListener] and
   * [unregisterBluetoothActionStateChangedEventListener]
   */
  private var listenerCount = 0
  private var isActionStateReceiverRegistered = false

  /**
   * Handle listener when ActionState changed accorded to android doc
   * https://developer.android.com/reference/android/bluetooth/BluetoothAdapter#ACTION_STATE_CHANGED
   * https://developer.android.com/reference/android/bluetooth/BluetoothAdapter#EXTRA_PREVIOUS_STATE
   */
  private val bluetoothStateReceiver = ActionStateChangedReceiver(this)

  init {
    registerBluetoothActivityEventListener()
    reactApplicationContext.addLifecycleEventListener(this)
  }

  override fun onHostResume() {}
  override fun onHostPause() {}
  override fun onHostDestroy() {
//    unregisterBluetoothActionStateChangedEventListener()
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  override fun isBluetoothEnabled(promise: Promise) {

    val adapter = bluetoothAdapter

    if (adapter == null) {
      val response = BluetoothResponse(
        success = false,
        message = "Bluetooth not available on this device"
      )
      return promise.resolve(response.toWriteableMap())
    }

    val enabled = adapter.isEnabled
    val response = BluetoothResponse(
      success = enabled,
      message = if (enabled) "Bluetooth enabled" else "Bluetooth desabled",
    )
    promise.resolve(response.toWriteableMap())
  }

  @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
  override fun enabledBluetooth(promise: Promise) {
    val adapter = bluetoothAdapter

    if (adapter == null) {
      return resolveBluetoothPromise(
        promise,
        success = false,
        message = "Bluetooth not available on this device"
      )
    }

    if (adapter.isEnabled) {
      return resolveBluetoothPromise(
        promise,
        success = true,
        message = "Bluetooth is already enabled"
      )
    }

    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      return resolveBluetoothPromise(
        promise,
        success = false,
        message = "Unable to access the current activity"
      )
    }

    try {
      val enableIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)

      /**
       * wait activity result for resolve promise
       * Check [registerBluetoothActivityEventListener]
       */
      bluetoothPromise = promise

      activity.startActivityForResult(enableIntent, BLUETOOTH_ENABLED_REQUEST)
    } catch (e: Exception) {
      return resolveBluetoothPromise(
        promise,
        success = false,
        message = "Error while requesting Bluetooth activation: ${e.message}"
      )
    }
    }


  override fun onBluetoothStateChanged(state: Int) {
    sendBluetoothStateEvent(state)
  }

  private fun sendBluetoothStateEvent(state: Int) {
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

      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(EventNames.BLUETOOTH_STATE_CHANGED, params)
    } catch (e: Exception) {
      Log.e(NAME, "Failed to emit Bluetooth state event", e)
    }
  }

  override fun addListener(eventName: String?) {
    if (listenerCount == 0) {
      registerBluetoothActionStateChangedEventListener()
    }

    listenerCount += 1
  }


  override fun removeListeners() {
    listenerCount -= 1
    unregisterBluetoothActionStateChangedEventListener()
  }



  private fun registerBluetoothActivityEventListener() {
    val listener = object : BaseActivityEventListener() {
      override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
      ) {
        if (requestCode != BLUETOOTH_ENABLED_REQUEST) return

        bluetoothPromise?.let { promise ->
          val (success, message) = when (resultCode) {
            Activity.RESULT_OK -> true to "User accepted to enable Bluetooth"
            Activity.RESULT_CANCELED -> false to "User denied enabling Bluetooth"
            else -> false to "Unexpected result code"
          }

          resolveBluetoothPromise(promise, success, message)
          bluetoothPromise = null
        }
      }
    }

    reactApplicationContext.addActivityEventListener(listener)
  }

  private fun registerBluetoothActionStateChangedEventListener() {
      try {
        val filter = IntentFilter(ActionStateChangedReceiver.FILTER_ACTION)
        reactApplicationContext.registerReceiver(bluetoothStateReceiver, filter)

        isActionStateReceiverRegistered = true
        Log.d(NAME, "state receiver registered")
      } catch (e: Exception) {
        Log.e(NAME, "Failed to register Bluetooth state receiver", e)
      }
  }

  private fun unregisterBluetoothActionStateChangedEventListener() {
      try {
        reactApplicationContext.unregisterReceiver(bluetoothStateReceiver)
        Log.d(NAME, "state receiver unregistered")
      } catch (e: Exception) {
        Log.e(NAME, "Failed to unregister Bluetooth state receiver", e)
      }
  }

  companion object {
    const val NAME = "RnSerialBluetoothClassic"
    const val BLUETOOTH_ENABLED_REQUEST = 1
  }
}
