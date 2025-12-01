apple
electron-build
echo $APPLE_I

export CSC_LINK="/FULL/PATH/TO/developerID.p12"
export CSC_KEY_PASSWORD="YOUR_P12_PASSWORD"
export APPLE_ID="your-apple-email@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="abcd-efgh-ijkl"
export APPLE_TEAM_ID="YOURTEAMID"

export CSC_NAME="TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)"
export CSC_LINK="/Users/tallesrocha/Documents/Certificates.p12"
export CSC_KEY_PASSWORD="Ubgkee8kk@@"
export APPLE_ID="talles71@gmail.com"
export APPLE_APP_SPECIFIC_PASSWORD="hbcs-rwmj-unah-asdd"
export APPLE_TEAM_ID="AMSA346LX4"

xcrun notarytool store-credentials "AC_PASSWORD" \
 --apple-id "talles71@gmail.com" \
 --team-id "AMSA346LX4" \
 --password "hbcs-rwmj-unah-asdd"

npx electron-packager . "SempreIoT" --platform=darwin --arch=arm64 --icon=icon.icns --overwrit
codesign --deep --force --sign "Developer ID Application: Your Name (TEAMID)" ./SempreIoT-darwin-arm64/SempreIoT.app
codesign --verify --deep --strict --verbose=2 ./SempreIoT-darwin-arm64/SempreIoT.app

AMSA346LX4

codesign --deep --force --options runtime --entitlements entitlements.mac.plist --timestamp \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app

---

create-dmg "dist/mac-arm64/sempreiot.app" \
 --overwrite \
 --dmg-title="Sempre IoT" \
 ./dist

xcrun altool --notarize-app \
 --primary-bundle-id "com.sempreiot.app" \
 --username "talles71@gmail.com" \
 --password "hbcs-rwmj-unah-asdd" \
 --file ./dist/sempreiot\ 1.0.0.dmg

---

# Sign helpers first

codesign --deep --force --options runtime --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 "dist/mac-arm64/sempreiot.app/Contents/Frameworks/sempreiot Helper.app"

codesign --deep --force --options runtime --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 "dist/mac-arm64/sempreiot.app/Contents/Frameworks/Electron Framework.framework"

codesign --deep --force --options runtime --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 "dist/mac-arm64/sempreiot.app"

## --

# Main helpers

codesign --force --options runtime --timestamp --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app/Contents/Frameworks/sempreiot\ Helper.app

codesign --force --options runtime --timestamp --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app/Contents/Frameworks/sempreiot\ Helper\ \(GPU\).app

codesign --force --options runtime --timestamp --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app/Contents/Frameworks/sempreiot\ Helper\ \(Renderer\).app

codesign --force --options runtime --timestamp --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app/Contents/Frameworks/sempreiot\ Helper\ \(Plugin\).app

codesign --force --options runtime --timestamp --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app/Contents/Frameworks/Squirrel.framework/Versions/A/Squirrel

codesign --force --options runtime --timestamp --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app/Contents/Frameworks/Squirrel.framework/Versions/A/Resources/ShipIt

codesign --force --options runtime --timestamp --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app/Contents/Frameworks/Electron\ Framework.framework/Versions/A/Electron\ Framework

codesign --force --options runtime --timestamp --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app/Contents/Frameworks/Electron\ Framework.framework/Versions/A/Libraries/libEGL.dylib

codesign --force --options runtime --timestamp --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app/Contents/Frameworks/Electron\ Framework.framework/Versions/A/Libraries/libvk_swiftshader.dylib

codesign --force --options runtime --timestamp --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app/Contents/Frameworks/Electron\ Framework.framework/Versions/A/Libraries/libGLESv2.dylib

codesign --force --options runtime --timestamp --entitlements entitlements.mac.plist \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app/Contents/Frameworks/Electron\ Framework.framework/Versions/A/Libraries/libffmpeg.dylib

##

codesign --deep --force --options runtime --timestamp \
 --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" \
 dist/mac-arm64/sempreiot.app

create-dmg "dist/mac-arm64/sempreiot.app" \
--overwrite \
--dmg-title="Sempre IoT" \
"./dist"

xcrun notarytool submit ./dist/sempreiot\ 1.0.0.dmg \
 --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_SPECIFIC_PASSWORD" \
 --team-id "AMSA346LX4" \
 --wait

xcrun stapler staple ./dist/sempreiot\ 1.0.0.dmg

### log

xcrun notarytool log d1eeaa9b-14c5-4101-8034-bc3fdf8e1a74 \
 --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_SPECIFIC_PASSWORD" \
 --team-id AMSA346LX4
