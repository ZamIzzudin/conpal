package com.mocci.lyrics;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;

@CapacitorPlugin(name = "LyricsPopup")
public class LyricsPopupPlugin extends Plugin {

  @PluginMethod
  public void open(PluginCall call) {
    if (!canDrawOverlays()) {
      Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:" + getContext().getPackageName()));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(intent);
      call.reject("Overlay permission required");
      return;
    }

    Intent serviceIntent = new Intent(getContext(), LyricsPopupService.class);
    serviceIntent.setAction(LyricsPopupService.ACTION_OPEN);
    startServiceCompat(serviceIntent);
    call.resolve();
  }

  @PluginMethod
  public void update(PluginCall call) {
    Intent serviceIntent = new Intent(getContext(), LyricsPopupService.class);
    serviceIntent.setAction(LyricsPopupService.ACTION_UPDATE);
    serviceIntent.putExtra("title", call.getString("title", ""));
    serviceIntent.putExtra("artist", call.getString("artist", ""));
    serviceIntent.putExtra("lyric", call.getString("lyric", ""));
    serviceIntent.putExtra("status", call.getString("status", "Paused"));
    startServiceCompat(serviceIntent);

    JSObject result = new JSObject();
    result.put("ok", true);
    call.resolve(result);
  }

  @PluginMethod
  public void close(PluginCall call) {
    Intent serviceIntent = new Intent(getContext(), LyricsPopupService.class);
    serviceIntent.setAction(LyricsPopupService.ACTION_CLOSE);
    getContext().startService(serviceIntent);
    call.resolve();
  }

  private boolean canDrawOverlays() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
    return Settings.canDrawOverlays(getContext());
  }

  private void startServiceCompat(Intent intent) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      getContext().startForegroundService(intent);
      return;
    }
    getContext().startService(intent);
  }
}
