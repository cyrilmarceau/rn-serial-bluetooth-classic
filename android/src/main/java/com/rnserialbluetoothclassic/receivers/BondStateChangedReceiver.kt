package com.rnserialbluetoothclassic.receivers

import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BondStateChangedReceiver(private val listener: BluetoothBondChangedListener) : BroadcastReceiver() {

  interface BluetoothBondChangedListener {
    fun onBluetoothBondChanged(bluetoothDevice: BluetoothDevice?)
  }

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == FILTER_ACTION_BOND_STATE_CHANGED) {
      val state = intent.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, BluetoothDevice.ERROR)
      val previousBondState = intent.getIntExtra(BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE, BluetoothDevice.ERROR)
      val bluetoothDevice: BluetoothDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
      } else {
        intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
      }

      Log.d("PairDevice", "state ${state}")


      when(state) {
        BluetoothDevice.BOND_BONDED -> {
          listener.onBluetoothBondChanged(bluetoothDevice)
          context.unregisterReceiver(this)
          Log.d("PairDevice", "BOND_BONDED:: Unregister receiver")
        }
        BluetoothDevice.BOND_NONE -> {
          listener.onBluetoothBondChanged(null)
          context.unregisterReceiver(this)
          Log.d("PairDevice", "BOND_NONE:: Unregister receiver")
        }
      }
    }
  }

  companion object {
    const val FILTER_ACTION_BOND_STATE_CHANGED = BluetoothDevice.ACTION_BOND_STATE_CHANGED
  }
}
