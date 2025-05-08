package com.rnserialbluetoothclassic.receivers

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class DiscoveryReceiver(private val listener: BluetoothDiscoveryListener) : BroadcastReceiver() {

  interface BluetoothDiscoveryListener {
    fun onDiscoveryChanged(device: BluetoothDevice)
    fun onDiscoveryFinished()
  }

  override fun onReceive(context: Context, intent: Intent) {

    if (intent.action == ACTION_FOUND) {
      val bluetoothDevice: BluetoothDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
      } else {
        intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
      }

      bluetoothDevice?.let {
        listener.onDiscoveryChanged(it)
      }
    } else if(intent.action == ACTION_DISCOVERY_FINISHED) {
      Log.d(TAG, "Discovery finished")
      listener.onDiscoveryFinished()
    }
  }

  companion object {
    const val TAG = "DiscoveryReceiver"
    const val ACTION_FOUND = BluetoothDevice.ACTION_FOUND
    const val ACTION_DISCOVERY_FINISHED = BluetoothAdapter.ACTION_DISCOVERY_FINISHED
  }
}
