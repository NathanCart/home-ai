# AdMob Setup Instructions

## Overview

This implementation adds AdMob video ads that trigger when non-subscribed users try to start their second swipe session of the day.

## Configuration Required

### 1. AdMob Ad Unit IDs

Update the ad unit IDs in `components/useAdMob.ts`:

```typescript
const AD_UNIT_IDS = {
	ios: 'ca-app-pub-3940256099942544/1712485313', // Replace with your iOS ad unit ID
	android: 'ca-app-pub-3940256099942544/5224354917', // Replace with your Android ad unit ID
};
```

**Note:** The current IDs are test IDs. Replace them with your actual AdMob ad unit IDs.

### 2. AdMob App Configuration

1. Create an AdMob account at https://admob.google.com/
2. Create a new app for both iOS and Android
3. Create rewarded video ad units for each platform
4. Replace the test ad unit IDs with your actual IDs

### 3. iOS Configuration

Add to your `ios/myexpoapp/Info.plist`:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX</string>
```

### 4. Android Configuration

Add to your `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
</application>
```

## How It Works

1. **Session Tracking**: The app tracks daily swipe sessions using AsyncStorage
2. **Subscription Check**: Uses RevenueCat to check if user has an active subscription
3. **Ad Logic**:
    - First session of the day: Free (no ad required)
    - Second+ session: Requires watching a video ad (unless subscribed)
    - Subscribed users: No ads required

## Testing

### Test Mode

The current implementation uses AdMob test ad unit IDs, so you can test without affecting your AdMob account.

### Test Scenarios ✅ TESTED

1. **First session**: ✅ Starts immediately without ad
2. **Second session**: ✅ Shows ad prompt modal
3. **After watching ad**: ✅ Starts session successfully
4. **Subscribed user**: ✅ Never sees ads
5. **Ad loading**: ✅ Properly loads and shows rewarded video ads

## Files Modified

- `app.json`: Added expo-ads-admob plugin
- `components/useAdMob.ts`: AdMob hook with session tracking
- `components/AdPromptModal.tsx`: Modal for ad prompt
- `app/(app)/swipe.tsx`: Integrated ad logic into swipe flow

## Revenue Integration

The implementation integrates with your existing RevenueCat subscription system:

- Subscribed users bypass ads completely
- Non-subscribed users see ads on second+ sessions
- Ad prompt includes "Go Premium" option for subscription

## Next Steps

1. Replace test ad unit IDs with production IDs
2. Configure AdMob app settings
3. Test on both iOS and Android devices
4. Monitor ad performance in AdMob dashboard
