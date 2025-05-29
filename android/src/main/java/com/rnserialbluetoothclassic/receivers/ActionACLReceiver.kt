package com.rnserialbluetoothclassic.receivers

import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log

class ActionACLReceiver(private val listener: BluetoothActionACLListener) : BroadcastReceiver() {

    interface BluetoothActionACLListener {
        fun onActionACLConnected(device: BluetoothDevice?)
        fun onActionACLDisconnected(device: BluetoothDevice?)
        fun onActionACLDisconnectRequest()
    }

    override fun onReceive(context: Context, intent: Intent) {
        val bluetoothDevice: BluetoothDevice? =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
            } else {

                intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
            }

        Log.d(TAG, "BluetoothDevice $bluetoothDevice")
        if (intent.action == ACTION_ACL_CONNECTED_ACTION) {
            listener.onActionACLConnected(bluetoothDevice)
        } else if (intent.action == ACTION_ACL_DISCONNECTED_ACTION) {
            listener.onActionACLDisconnected(bluetoothDevice)
        } else if (intent.action == ACTION_ACL_DISCONNECTED_REQUEST_ACTION) {
            listener.onActionACLDisconnectRequest()
        }
    }

    companion object {
        const val TAG = "ActionACLReceiver"
        const val ACTION_ACL_CONNECTED_ACTION = BluetoothDevice.ACTION_ACL_CONNECTED
        const val ACTION_ACL_DISCONNECTED_ACTION = BluetoothDevice.ACTION_ACL_DISCONNECTED
        const val ACTION_ACL_DISCONNECTED_REQUEST_ACTION =
            BluetoothDevice.ACTION_ACL_DISCONNECT_REQUESTED

        fun getIntentFilter(): IntentFilter {
            return IntentFilter().apply {
                addAction(ACTION_ACL_CONNECTED_ACTION)
                addAction(ACTION_ACL_DISCONNECTED_ACTION)
                addAction(ACTION_ACL_DISCONNECTED_REQUEST_ACTION)
            }
        }
    }
}
