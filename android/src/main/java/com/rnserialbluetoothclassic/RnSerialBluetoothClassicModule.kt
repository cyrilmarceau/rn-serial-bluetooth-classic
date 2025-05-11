package com.rnserialbluetoothclassic

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.IntentFilter
import android.util.Log
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.rnserialbluetoothclassic.bluetooth.BluetoothAdapterManager
import com.rnserialbluetoothclassic.bluetooth.BluetoothDeviceManager
import com.rnserialbluetoothclassic.event.BluetoothEventEmitter
import com.rnserialbluetoothclassic.receivers.ActionStateChangedReceiver
import com.rnserialbluetoothclassic.receivers.BondStateChangedReceiver
import com.rnserialbluetoothclassic.receivers.DiscoveryReceiver


@ReactModule(name = RnSerialBluetoothClassicModule.NAME)
class RnSerialBluetoothClassicModule(reactContext: ReactApplicationContext) :
  NativeRnSerialBluetoothClassicSpec(reactContext),
  ActionStateChangedReceiver.BluetoothStateChangeListener,
  DiscoveryReceiver.BluetoothDiscoveryListener,
  BondStateChangedReceiver.BluetoothBondChangedListener,
  LifecycleEventListener {

  override fun getName(): String {
    return NAME
  }

  private val eventEmitter = BluetoothEventEmitter(reactContext)
  private val adapterManager = BluetoothAdapterManager(reactContext)
  private val deviceManager = BluetoothDeviceManager(eventEmitter, adapterManager.getAdapter())

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
  private val bondReceiver = BondStateChangedReceiver(this)

  init {
    adapterManager.registerBluetoothActivityEventListener()
    reactApplicationContext.addLifecycleEventListener(this)
  }

  override fun onHostResume() {}
  override fun onHostPause() {}
  override fun onHostDestroy() {
    adapterManager.cleanup()
    reactApplicationContext.unregisterReceiver(bluetoothStateReceiver)
    reactApplicationContext.unregisterReceiver(discoveryReceiver)
    reactApplicationContext.unregisterReceiver(bondReceiver)
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  override fun isBluetoothEnabled(promise: Promise) {
    return adapterManager.isBluetoothEnabled(promise)
  }

  @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
  override fun enabledBluetooth(promise: Promise) {
    return adapterManager.enableBluetooth(promise)
  }

  @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
  override fun pairDevice(address: String, promise: Promise) {
    val filter = IntentFilter(BondStateChangedReceiver.FILTER_ACTION_BOND_STATE_CHANGED)
    reactApplicationContext.registerReceiver(bondReceiver, filter)
    Log.d("PairDevice", "bond receiver registered")

    deviceManager.pairDevice(address = address, promise = promise)
  }

  @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
  override fun getBondedDevices(promise: Promise) {
    deviceManager.getBondedDevices(promise)
  }

  @RequiresPermission(Manifest.permission.BLUETOOTH_SCAN)
  override fun startDiscovery(promise: Promise) {
    val filter = IntentFilter().apply {
      addAction(BluetoothDevice.ACTION_FOUND)
      addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)
    }
    reactApplicationContext.registerReceiver(discoveryReceiver, filter)

    deviceManager.startDiscovery(promise)
  }

  /**
   * Listener --------------------------------------------------------------------------------------
   */
  @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
  override fun onBluetoothBondChanged(device: BluetoothDevice?) {
   eventEmitter.emitBondChanged(device)
  }
  override fun onDiscoveryFinished() {
    reactApplicationContext.unregisterReceiver(discoveryReceiver)
    eventEmitter.emitDiscoveryFinished()
  }
  override fun onDiscoveryChanged(device: BluetoothDevice) {
    eventEmitter.emitDiscoveryChanged(device)
  }
  override fun onBluetoothStateChanged(state: Int) {
    eventEmitter.emitStateChanged(state)
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
  }
}
