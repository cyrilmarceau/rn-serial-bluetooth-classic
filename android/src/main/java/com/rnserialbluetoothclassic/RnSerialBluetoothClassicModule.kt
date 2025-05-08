package com.rnserialbluetoothclassic

import android.Manifest
import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresPermission
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.rnserialbluetoothclassic.domain.EventNames
import com.rnserialbluetoothclassic.exception.BluetoothException
import com.rnserialbluetoothclassic.receivers.ActionStateChangedReceiver
import com.rnserialbluetoothclassic.receivers.DiscoveryReceiver
import com.rnserialbluetoothclassic.utils.resolveBluetoothPromise


@ReactModule(name = RnSerialBluetoothClassicModule.NAME)
class RnSerialBluetoothClassicModule(reactContext: ReactApplicationContext) :
  NativeRnSerialBluetoothClassicSpec(reactContext),
  ActionStateChangedReceiver.BluetoothStateChangeListener,
  DiscoveryReceiver.BluetoothDiscoveryListener,
  LifecycleEventListener {

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

  /**
   * Handle listener when ActionState changed accorded to android doc
   * https://developer.android.com/reference/android/bluetooth/BluetoothAdapter#ACTION_STATE_CHANGED
   * https://developer.android.com/reference/android/bluetooth/BluetoothAdapter#EXTRA_PREVIOUS_STATE
   */
  private val bluetoothStateReceiver = ActionStateChangedReceiver(this)
  private val discoveryReceiver = DiscoveryReceiver(this)

  init {
    registerBluetoothActivityEventListener()
//    registerDiscoveryActivityEventListener
    reactApplicationContext.addLifecycleEventListener(this)
  }

  override fun onHostResume() {}
  override fun onHostPause() {}
  override fun onHostDestroy() {}

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  override fun isBluetoothEnabled(promise: Promise) {
    val adapter = bluetoothAdapter

    if (adapter == null) {
      return BluetoothException.ADAPTER_NULL_ERROR.reject(promise)
    }

    return promise.resolve(adapter.isEnabled)
  }

  @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
  override fun enabledBluetooth(promise: Promise) {
    val adapter = bluetoothAdapter

    if (adapter == null) {
      return BluetoothException.ADAPTER_NULL_ERROR.reject(promise)
    }

    if (adapter.isEnabled) {
      return promise.resolve(adapter.isEnabled)
    }

    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      BluetoothException.ACTIVITY_ACCESS_ERROR.reject(promise)
      return
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
      promise.reject("BLUETOOTH_ERROR", "Error while requesting Bluetooth activation: ${e.message}")
      return
    }
  }


  @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
  override fun getBondedDevices(promise: Promise) {
    val adapter = bluetoothAdapter

    if (adapter == null) {
      return BluetoothException.ADAPTER_NULL_ERROR.reject(promise)
    }

    if (!adapter.isEnabled) {
      return BluetoothException.BLUETOOTH_DISABLED_ERROR.reject(promise)
    }

    try {
      val pairedDevices: Set<BluetoothDevice>? = adapter.bondedDevices
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

  @RequiresPermission(Manifest.permission.BLUETOOTH_SCAN)
  override fun startDiscovery(promise: Promise) {
    val adapter = bluetoothAdapter

    if (adapter == null) {
      return BluetoothException.ADAPTER_NULL_ERROR.reject(promise)
    }

    if (!adapter.isEnabled) {
      return BluetoothException.BLUETOOTH_DISABLED_ERROR.reject(promise)
    }

    try {
      // If a current discovery is started, cancel it
      if (adapter.isDiscovering) {
        adapter.cancelDiscovery()
      }

      val filter = IntentFilter().apply {
        addAction(BluetoothDevice.ACTION_FOUND)
        addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)
      }
      reactApplicationContext.registerReceiver(discoveryReceiver, filter)

      val hasSuccessfullyStarted = adapter.startDiscovery()

      promise.resolve(hasSuccessfullyStarted)

      Log.d(NAME, "discovery receiver registered")
    } catch (e: Exception) {
      Log.e(NAME, "Failed to register Bluetooth state receiver", e)
      promise.reject(e)
    }
  }

  /**
   * Listener --------------------------------------------------------------------------------------
   */
  override fun onDiscoveryFinished() {
    val params = Arguments.createMap()

    reactApplicationContext.unregisterReceiver(discoveryReceiver)

    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(EventNames.ON_DISCOVERY_FINISHED, params)
  }
  override fun onDiscoveryChanged(device: BluetoothDevice) {

    try {

      if (ActivityCompat.checkSelfPermission(
          reactApplicationContext,
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

      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(EventNames.ON_DISCOVERY_DEVICE, params)
    } catch (e: Exception) {
      Log.e(NAME, "Failed to emit new devices on event", e)
    }
  }

  override fun onBluetoothStateChanged(state: Int) {
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

  override fun removeListeners(count: Double) {
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

          promise.resolve(success)
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
