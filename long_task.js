const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

async function buildApk(outputDir) {
  return new Promise((resolve, reject) => {
    console.log("executing");
    exec(
      `cd Recovery && flutter pub run flutter_launcher_icons && flutter build apk`,
      (error, stdout, stderr) => {
        // exec(`cd Recovery && flutter clean && flutter pub get`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        const apkOutputPath = path.join(
          __dirname,
          "Recovery",
          "build",
          "app",
          "outputs",
          "flutter-apk"
        );

        fs.readdir(apkOutputPath, (err, files) => {
          if (err) {
            reject(err);
            return;
          }
          if (stderr) {
           console.log(`stderr : ${stderr}`);
          }

          // Look for an APK file in the directory
          const apkFile = files.find((file) => file.endsWith(".apk"));
          if (!apkFile) {
            reject(new Error("APK file not found"));
            return;
          }

          // Move the APK file to the output directory
          const oldPath = path.join(apkOutputPath, apkFile);
          const newPath = path.join(outputDir, apkFile);
          fs.rename(oldPath, newPath, (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(newPath);
          });
        });
      }
    );
  });
}

process.on("message", async (message) => {
  if (message.command === "start") {
    try {
      var apkPath = await buildApk(message.outputDir);
     process.send({ apkPath })
    } catch (error) {
      console.log(error);
      process.send({ status: "failure" });
    }
  }
});
