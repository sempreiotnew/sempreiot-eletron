#!/usr/bin/env bash
set -euo pipefail

IDENTITY='Developer ID Application: TALLES AUGUST0 FERREIRA DA ROCHA (AMSA346LX4)'
APP='dist/mac-arm64/sempreiot.app'
ENT='entitlements.mac.plist'

echo "1) Removing any existing signatures (top-level and common inner files)..."
# remove top-level signature and try to remove signatures on common inner files
codesign --remove-signature "$APP" || true
# remove signatures from known execs (safe if not signed)
find "$APP" -type f \( -name '*.dylib' -o -name '*.so' -o -perm -111 -o -name 'ShipIt' \) -print0 \
  | xargs -0 -I{} bash -c 'codesign --remove-signature "{}" >/dev/null 2>&1 || true'

echo "2) Sign all .dylib (libraries) first (no entitlements)"
find "$APP/Contents/Frameworks" -name '*.dylib' -print0 | while IFS= read -r -d '' LIB; do
  echo " signing lib: $LIB"
  codesign --force --timestamp --options runtime --sign "$IDENTITY" "$LIB"
done

echo "3) Sign native helper binaries inside Electron Framework Helpers (chrome_crashpad_handler etc.)"
find "$APP/Contents/Frameworks" -path '*/Helpers/*' -type f -perm -111 -print0 | while IFS= read -r -d '' H; do
  echo " signing helper exec: $H"
  codesign --force --timestamp --options runtime --sign "$IDENTITY" "$H"
done

echo "4) Sign framework binaries (Electron Framework, Mantle, ReactiveObjC, Squirrel etc.)"
# Signs inner framework binaries
find "$APP/Contents/Frameworks" -type f \( -name 'Electron Framework' -o -name 'Mantle' -o -name 'ReactiveObjC' -o -name 'Squirrel' -o -name 'ShipIt' \) -print0 \
  | while IFS= read -r -d '' F; do
    echo " signing framework binary: $F"
    codesign --force --timestamp --options runtime --sign "$IDENTITY" "$F"
  done

# Sign entire frameworks directories (this will sign resources inside and is OK because we've signed their binaries)
echo "5) Sign Framework directories (so their internal metadata is sealed)"
find "$APP/Contents/Frameworks" -maxdepth 2 -type d -name '*.framework' -print0 | while IFS= read -r -d '' FR; do
  echo " signing framework dir: $FR"
  codesign --force --timestamp --options runtime --sign "$IDENTITY" "$FR"
done

echo "6) Sign helper .app bundles (sempreiot Helper, GPU, Renderer, Plugin) with entitlements"
find "$APP/Contents/Frameworks" -maxdepth 2 -type d -name '*.app' -print0 | while IFS= read -r -d '' HA; do
  echo " signing helper app: $HA"
  codesign --force --timestamp --options runtime --entitlements "$ENT" --sign "$IDENTITY" "$HA"
done

echo "7) Sign the Electron Framework main binary (after helpers/libs are signed)"
EF="$APP/Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework"
if [ -f "$EF" ]; then
  echo " signing Electron Framework: $EF"
  codesign --force --timestamp --options runtime --sign "$IDENTITY" "$EF"
fi

echo "8) Sign main executable with entitlements"
codesign --force --timestamp --options runtime --entitlements "$ENT" --sign "$IDENTITY" "$APP/Contents/MacOS/sempreiot"

echo "9) Finally sign the top-level app bundle (no --deep)"
codesign --force --timestamp --options runtime --entitlements "$ENT" --sign "$IDENTITY" "$APP"

echo "10) Verify signatures (verbose):"
codesign --verify --deep --strict --verbose=2 "$APP" || true
spctl -a -t exec -vv "$APP" || true

echo "DONE. If verification shows any 'missing/modified' files, inspect the listed paths."
