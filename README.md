# Passkey app

Hat tip to [this repository](https://github.com/tkhq/passkeyapp/blob/main/README.md) for the passkey configuration setup.

## Running the app locally on iOS

### Provisioning profile

To trigger passkey prompts you will need a way to sign the app with a proper provisioning profile. Follow the steps outlined in https://docs.expo.dev/app-signing/app-credentials/#provisioning-profiles. TL;DR: run `eas credentials`.

### Expo build & run recipes

- `npx expo run:ios` will start the app using expo on a simulator
- To run with expo on your iOS device, connect the device and run `npx expo run:ios --device` (the device needs to have developer mode enabled and be connected to your Mac)
- `eas build -p ios --profile preview` will trigger a build through expo (online CI). This gets you a QR code to install on any device covered by the provisioning profile
- `npx expo prebuild --platform ios` will "prebuild" and let you build locally with xcode. Then open the project with the `PasskeyApp.xcworkspace` file to build with xcode (this is useful)
- `eas build --platform ios --local --profile preview` can be used to run a local build without xcode, and will produce a `.ipa` file. The `.ipa` can be dropped on the device through xcode: "Window" -> "Devices and Simulators", then drop the app under the "Installed Apps" section.

## Running the app locally on Android

Android requires a signed APK linked to an origin via an `assetlinks.json` file. Follow [these instructions](https://coderwall.com/p/r09hoq/android-generate-release-debug-keystores) and reference your debug keystore from you `eas.json` file:

```json
"android":  {
    "buildType": "apk",
    "credentialsSource": "local"
}
```

The above `eas.json` section references "local" credentials and will look for a "credentials.json" file:

```
{
    "android": {
      "keystore": {
        "keystorePath": "./debug.keystore",
        "keystorePassword": "android",
        "keyAlias": "androiddebugkey",
        "keyPassword": "android"
      }
    }
}
```

This is "okay" to commit to git given it's only a local debug store without any value. DO NOT DO THIS WITH ANY OTHER KEYSTORE!

Finally, you need to grab your certificate's sha256 fingerprint and associate it with your domain by hosting a new file at `/.well-known/assetlinks.json`:

```json
[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.kxo.testexpo",
      "sha256_cert_fingerprints": [
        "F4:F8:19:A1:1C:00:04:73:54:CD:AD:D9:84:71:DF:B1:19:2A:0E:EE:14:7A:71:F4:9A:00:1B:2C:5A:20:9A:FC"
      ]
    }
  }
]
```

You can get your certificate fingerprint with:

```sh
$ keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Expo build & run recipes

- `eas build --platform android --local --profile preview` produces an APK file
- If you are testing on a real device, enable [developer mode](https://developer.android.com/studio/debug/dev-options) and pair your device with Android Studio (see [this](https://developer.android.com/studio/run/device#wireless)) to get debug logs via [LogCat](https://developer.android.com/studio/debug/logcat). That's really helpful to figure out what's going on.
- If you are testing on a simulator you need to log into a Google account on the simulator and configure PIN encryption to test passkey functionality. A good test to see if your simulator is set up correctly: visit https://webauthn.io from the Chrome browser and try to sign up / sign in with a passkey before testing your APK
- Once you have your simulator or real device ready, install your APK with `adb`:

  ```sh
  $ adb devices -l
  List of devices attached
  emulator-5554          device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emu64a transport_id:1

  # Note the transport option: "-t1".
  # In this case because it has "transport_id:1"
  $ adb -t1 install <path/to/apkfile>.apk
  ```

Note: a more convenient option if you're simply looking to run debug mode for your app: `npx expo run:android -d` will yield a dropdown of available devices and run your app in debug mode! But careful: **this doesn't work to test passkey functionality because the app won't be signed**.

## Troubleshooting

### com.apple.AuthenticationServices.AuthorizationError Code=1004

```
[AuthenticationServices] ASAuthorizationController credential request failed with error: Error
Domain=com.apple.AuthenticationServices.AuthorizationError Code=1004 "(null)"
```

This happens when the RPID is incorrect. I have no idea why Apple doesn't return a proper error here. The RPID should be the domain name (inverse of the bundle ID). E.g. `passkey-http.alkassimk.workers.dev`

### This app cannot be installed because its integrity could not be verified

If you're trying to installed a `.ipa` file on a device without signing it with a provisioning profile linked to this device, that's the message you get. Make sure you select the right profile when building (this also happened to me if I do not select a profile at all: `eas build --platform ios --local` produces a by-default unsigned `.ipa` file!)

### My apple-app-site-association-file (AASA file) isn't updated? What is the app actually loading?

This is so frustrating. AASA files aren't loaded directly by apps, they're loaded from a special-purpose Apple CDN which caches these files.

Supposedly it's refreshed on install, but I have seen evidence to the contrary in my testing. Solutions:

- use `mode=developer` ([docs](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_associated-domains)): this lets you bypass SSL restrictions and use a self-signed cert. But you might as well use ngrok, it'll provide a valid cert. Developer mode also causes fetching to go straight from app to server instead of using the Apple CDN. This might work for you!
- check `curl -v https://app-site-association.cdn-apple.com/a/v1/<your-domain>` to see what your app is "seeing". This is useful if you're trying to debug production-like setups where developer mode isn't an option

Another tool that can be useful: https://branch.io/resources/aasa-validator. It's a validator for AASA files. You do not need "applinks" if all you're doing in passkeys so don't trust 100% of the things it says. But it's useful to rule out basic issues like invalid JSON or MIME type. [This article](https://towardsdev.com/swift-associated-domains-universal-links-aasa-webcredentials-c66900df7b7e) is how I found this tool.

### `{"error": "Native error", "message": "The"}`

This is because `react-native-passkey` isn't loaded in your package.json. I'm not sure why but requiring it from `@turnkey/react-native-passkey-stamper` isn't sufficient. You have to require it from the react-native project itself. Is there something we can do in the `@turnkey` package to remove this requirement? Please open an issue or reach out if you know of something!

### Cannot find module '[...]/code/scripts/generate-specs-cli.js`

This happened for me during builds:

```
Node found at: /Users/rno/.nvm/versions/node/v18.18.2/bin/node
node:internal/modules/cjs/loader:1080
  throw err;
  ^

Error: Cannot find module '/Users/rno/tkhq/code/scripts/generate-specs-cli.js'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1077:15)
    at Module._load (node:internal/modules/cjs/loader:922:27)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:86:12)
    at node:internal/main/run_main_module:23:47 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}
```

The reason is `CDPATH` was set:

```
echo $CDPATH
/Users/rno/tkhq/code
```

This was hard to figure out, but someone on the internet had the same issue (https://github.com/facebook/react-native/issues/35747):

```
$ unset CDPATH
$ rm -rf ios
$ npm run ios
```
