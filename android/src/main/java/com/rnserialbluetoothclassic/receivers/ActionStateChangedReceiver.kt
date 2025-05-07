package com.rnserialbluetoothclassic.receivers

import android.bluetooth.BluetoothAdapter
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ActionStateChangedReceiver(private val listener: BluetoothStateChangeListener) : BroadcastReceiver() {

  interface BluetoothStateChangeListener {
    fun onBluetoothStateChanged(state: Int)
  }

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == BluetoothAdapter.ACTION_STATE_CHANGED) {
      val state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)
      listener.onBluetoothStateChanged(state)
    }
  }

  companion object {
    const val FILTER_ACTION = BluetoothAdapter.ACTION_STATE_CHANGED
  }
}
