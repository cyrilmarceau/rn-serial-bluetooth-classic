package com.rnserialbluetoothclassic.extension

import com.facebook.react.bridge.ReadableMap

fun ReadableMap.getSafeInt(key: String, default: Int = 0): Int {
    return if (hasKey(key) && !isNull(key)) getInt(key) else default
}

fun ReadableMap.getSafeString(key: String, default: String = ""): String {
    return if (hasKey(key) && !isNull(key)) getString(key) ?: default else default
}
