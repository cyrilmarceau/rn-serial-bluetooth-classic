package com.rnserialbluetoothclassic.connection

import android.Manifest
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.util.Log
import androidx.annotation.RequiresPermission
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.rnserialbluetoothclassic.event.BluetoothEventEmitter
import com.rnserialbluetoothclassic.extension.getSafeInt
import com.rnserialbluetoothclassic.extension.getSafeString
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream

class ThreadConnection(
    private val socket: BluetoothSocket,
    private val device: BluetoothDevice,
    private val options: ReadableMap,
    private val eventEmitter: BluetoothEventEmitter,
    private val promise: Promise
) : Thread() {

    private var mmInStream: InputStream? = null
    private var mmOutStream: OutputStream? = null
    private var isRunning = true
    private var isConnected = false

    val mmBuffer: ByteArray by lazy {
        ByteArray(options.getSafeInt("bufferLength", 1024))
    }
    val delimiter: String by lazy {
        options.getSafeString("delimiter", "\n")
    }

    private val buffer = StringBuilder()
    
    private fun bytesToHex(bytes: ByteArray): String {
        return bytes.joinToString("") { "%02X".format(it) }
    }

    @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
    override fun run() {
        try {
            Log.d("SocketThread", "Run")
            socket.connect()

            mmInStream = socket.inputStream
            mmOutStream = socket.outputStream
            isConnected = true

            while (isRunning) {
                try {
                    val numBytes = mmInStream?.read(mmBuffer) ?: -1

                    if (numBytes == -1) {
                        if (isRunning) {
                            eventEmitter.emitActionACLDisconnected(device)
                        }
                        break
                    }

                    if (numBytes > 0) {
                        val receivedData = mmBuffer.copyOfRange(0, numBytes)
                        val hexData = bytesToHex(receivedData)
                        buffer.append(hexData)

                        if (delimiter.isBlank()) {
                            val content = buffer.toString()
                            if (content.isNotEmpty()) {
                                Log.d("SocketThread", "Received data: $content")
                                eventEmitter.emitDataReceived(device.address, content)
                                buffer.clear()
                            }
                        } else {
                            val content = buffer.toString()
                            var startIndex = 0

                            while (startIndex < content.length) {
                                val delimiterIndex = content.indexOf(delimiter, startIndex)
                                if (delimiterIndex == -1) {
                                    break
                                }

                                if (delimiterIndex > startIndex) {
                                    val message = content.substring(startIndex, delimiterIndex)
                                    if (message.isNotEmpty()) {
                                        Log.d("SocketThread", "Received message: $message")
                                        eventEmitter.emitDataReceived(device.address, message)
                                    }
                                }

                                val messageStart = delimiterIndex
                                val nextDelimiterIndex =
                                    content.indexOf(delimiter, messageStart + delimiter.length)
                                val messageEnd =
                                    if (nextDelimiterIndex != -1) nextDelimiterIndex else content.length

                                val message = content.substring(messageStart, messageEnd)
                                if (message.isNotEmpty()) {
                                    eventEmitter.emitDataReceived(device.address, message)
                                }
                                startIndex = messageEnd
                            }

                            if (startIndex > 0) {
                                buffer.delete(0, startIndex)
                            }
                        }
                    }
                } catch (e: IOException) {
                    Log.d("SocketThread", "Input stream was disconnected", e)
                    if (isRunning) {
                        eventEmitter.emitActionACLDisconnected(device)
                    }
                    break
                }
            }
        } catch (e: IOException) {
            Log.d("SocketThread", "Failed to connect", e)
            if (!isConnected) {
                promise.reject("CONNECTION_FAILED", "Failed to connect to device: ${e.message}", e)
            }
        } finally {
            cleanup()
        }
    }

    /**
     * Write data to the connected device
     * @param data The string data to write
     * @return true if successful, false otherwise
     */
    fun write(data: ByteArray): Boolean {
        return try {
            mmOutStream?.write(data)
            mmOutStream?.flush()
            true
        } catch (e: IOException) {
            Log.e("SocketThread", "Error writing data", e)
            false
        }
    }

    fun cancel() {
        isRunning = false
        cleanup()
    }

    private fun cleanup() {
        try {
            mmInStream?.close()
            Log.d("SocketThread", "Close mmInStream")
        } catch (e: IOException) {
            Log.d("SocketThread", "Error closing input stream", e)
        }

        try {
            mmOutStream?.close()
            Log.d("SocketThread", "Close mmOutStream")
        } catch (e: IOException) {
            Log.d("SocketThread", "Error closing output stream", e)
        }

        try {
            socket.close()
            Log.d("SocketThread", "Close socket")
        } catch (e: IOException) {
            Log.d("SocketThread", "Error closing socket", e)
        }
    }
}
