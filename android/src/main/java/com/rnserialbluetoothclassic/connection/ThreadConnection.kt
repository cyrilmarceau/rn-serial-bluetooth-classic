package com.rnserialbluetoothclassic.connection

import android.Manifest
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.util.Log
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.Promise
import com.rnserialbluetoothclassic.event.BluetoothEventEmitter

class ThreadConnection(
  private val socket: BluetoothSocket,
  private val device: BluetoothDevice,
  private val eventEmitter: BluetoothEventEmitter,
  private val promise: Promise
) : Thread() {

  @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
  override fun run() {
    try {
      socket.connect()
      Log.d("SocketThread", "Connected")
    }  catch (e: Exception) {
      Log.d("SocketThread", "An error occured during conn", e)
      try {
        socket.close()
      } catch (closeException: Exception) {
        Log.d("SocketThread", "Error during close socket", closeException)
      }
    }
  }

  fun write(data: ByteArray): Boolean {
    return try {
      socket.outputStream.write(data)
      true
    } catch (e: Exception) {
      Log.d("SocketThread", "Error during writing to socket", e)
      false
    }
  }

  fun close() {
    try {
      socket.close()
    } catch (e: Exception) {
      Log.d("SocketThread", "Error during close socket", e)
    }
  }
}

