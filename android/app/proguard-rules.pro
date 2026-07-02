# Keep all classes used by react-native-llama JNI bridge
-keep class com.rnllama.** { *; }

# Keep llama.cpp native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# React Native core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# MMKV
-keep class com.tencent.mmkv.** { *; }

# React Navigation
-keep class com.reactnativecommunity.** { *; }

# Keep model wrapper data classes
-keep class com.handyai.** { *; }
