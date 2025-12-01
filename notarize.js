import { notarize } from "@electron/notarize";

export default async function notarizeApp(context) {
  if (process.platform !== "darwin") return;
  const { appOutDir } = context;

  console.log(appOutDir);
  console.log(process.env.APPLE_ID);
  console.log(process.env.APPLE_APP_SPECIFIC_PASSWORD);
  console.log("Notarizing", appOutDir);

  await notarize({
    appBundleId: "com.sempreiot.app",
    appPath: `${appOutDir}/sempreiot.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
  });

  console.log("Notarization complete");
}
