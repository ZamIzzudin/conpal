package com.mocci.lyrics;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(LyricsPopupPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
