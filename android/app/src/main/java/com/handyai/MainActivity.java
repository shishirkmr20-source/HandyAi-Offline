package com.handyai;

import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends ReactActivity {

  @Override
  protected String getMainComponentName() {
    return "HandyAi";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // Boot theme — applied via styles.xml to give a dark splash before JS loads
    setTheme(R.style.AppTheme);
    super.onCreate(null);
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        false  // new arch disabled for v1; flip when migrating
    );
  }
}
