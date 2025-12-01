# Export environment variables

export APPLE_ID="your-apple-email@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="abcd-efgh-ijkl"
export APPLE_TEAM_ID="YOURTEAMID"

### HOW TO SIGN APPLE APPLICATION WITH DEVELOPER ID

# No problem getting erros this is just for generating the dist folder

npm run build:mac

# run this script to sign file and all binaries

./resign.sh

# Enter the app folder

cd dist/mac-arm64

# Generate .zip with the app folder

ditto -c -k --keepParent "sempreiot.app" "sempreiot.zip"

# Submit to check if everything is fine

xcrun notarytool submit sempreiot.zip \
 --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_SPECIFIC_PASSWORD" \
 --team-id "AMSA346LX4" \
 --wait

# staple

xcrun stapler staple "sempreiot.app"

## To generate a signed DMG file

create-dmg "dist/mac-arm64/sempreiot.app" \
--overwrite \
--dmg-title="Sempre IoT" \
"./dist"

# Sign the generated DMG file

codesign --force --sign "Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)" ./dist/sempreiot\ 1.0.0.dmg

# Submit the DMG file

xcrun notarytool submit ./dist/sempreiot\ 1.0.0.dmg \
 --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_SPECIFIC_PASSWORD" \
 --team-id "AMSA346LX4" \
 --wait

# staple it

xcrun stapler staple ./dist/sempreiot\ 1.0.0.dmg
