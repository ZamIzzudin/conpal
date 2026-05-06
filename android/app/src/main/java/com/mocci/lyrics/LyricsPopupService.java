package com.mocci.lyrics;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;

public class LyricsPopupService extends Service {
  public static final String ACTION_OPEN = "lyrics_popup_open";
  public static final String ACTION_UPDATE = "lyrics_popup_update";
  public static final String ACTION_CLOSE = "lyrics_popup_close";

  private static final String CHANNEL_ID = "lyrics_popup_channel";

  private WindowManager windowManager;
  private View floatingView;
  private TextView titleView;
  private TextView artistView;
  private TextView lyricView;
  private TextView statusView;

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent == null) return START_NOT_STICKY;

    String action = intent.getAction();
    if (ACTION_CLOSE.equals(action)) {
      stopSelf();
      return START_NOT_STICKY;
    }

    startForegroundService();

    if (floatingView == null) {
      createFloatingView();
    }

    if (ACTION_UPDATE.equals(action) || ACTION_OPEN.equals(action)) {
      updateContent(
        intent.getStringExtra("title"),
        intent.getStringExtra("artist"),
        intent.getStringExtra("lyric"),
        intent.getStringExtra("status")
      );
    }

    return START_STICKY;
  }

  private void startForegroundService() {
    NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel channel = new NotificationChannel(
        CHANNEL_ID,
        "Lyrics Popup",
        NotificationManager.IMPORTANCE_MIN
      );
      manager.createNotificationChannel(channel);
    }

    Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Lyrics Popup aktif")
      .setContentText("Popup view sedang berjalan")
      .setSmallIcon(android.R.drawable.ic_media_play)
      .setOngoing(true)
      .build();

    startForeground(1001, notification);
  }

  private void createFloatingView() {
    windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

    LinearLayout root = new LinearLayout(this);
    root.setOrientation(LinearLayout.VERTICAL);
    root.setPadding(28, 24, 28, 24);
    root.setBackgroundColor(0xF0282830);

    titleView = new TextView(this);
    titleView.setTextColor(0xFFFFFFFF);
    titleView.setTextSize(16f);

    artistView = new TextView(this);
    artistView.setTextColor(0xFFB3B3C0);
    artistView.setTextSize(12f);

    lyricView = new TextView(this);
    lyricView.setTextColor(0xFFC4B5FD);
    lyricView.setTextSize(17f);
    lyricView.setPadding(0, 10, 0, 10);

    statusView = new TextView(this);
    statusView.setTextColor(0xFFB3B3C0);
    statusView.setTextSize(11f);

    root.addView(titleView);
    root.addView(artistView);
    root.addView(lyricView);
    root.addView(statusView);

    int layoutType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
      ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
      : WindowManager.LayoutParams.TYPE_PHONE;

    WindowManager.LayoutParams params = new WindowManager.LayoutParams(
      620,
      WindowManager.LayoutParams.WRAP_CONTENT,
      layoutType,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
      PixelFormat.TRANSLUCENT
    );
    params.gravity = Gravity.TOP | Gravity.START;
    params.x = 40;
    params.y = 180;

    root.setOnTouchListener(new View.OnTouchListener() {
      private int initialX;
      private int initialY;
      private float initialTouchX;
      private float initialTouchY;

      @Override
      public boolean onTouch(View v, MotionEvent event) {
        switch (event.getAction()) {
          case MotionEvent.ACTION_DOWN:
            initialX = params.x;
            initialY = params.y;
            initialTouchX = event.getRawX();
            initialTouchY = event.getRawY();
            return true;
          case MotionEvent.ACTION_MOVE:
            params.x = initialX + (int) (event.getRawX() - initialTouchX);
            params.y = initialY + (int) (event.getRawY() - initialTouchY);
            if (windowManager != null && floatingView != null) {
              windowManager.updateViewLayout(floatingView, params);
            }
            return true;
          default:
            return false;
        }
      }
    });

    floatingView = root;
    windowManager.addView(floatingView, params);
  }

  private void updateContent(String title, String artist, String lyric, String status) {
    if (titleView != null && title != null) titleView.setText(title);
    if (artistView != null && artist != null) artistView.setText(artist);
    if (lyricView != null && lyric != null) lyricView.setText(lyric);
    if (statusView != null && status != null) statusView.setText(status);
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    if (windowManager != null && floatingView != null) {
      windowManager.removeView(floatingView);
      floatingView = null;
    }
  }

  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }
}
