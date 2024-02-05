const { spawn, fork } = require("child_process");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { renameApp, setAgencyDetails } = require("./rename-app.js");
const app = express();
const port = 3000;

app.use(express.json());

app.get("/rundart", (req, res) => {
  // Specify the path to your Dart script
  const dartScriptPath =
    "C:\\Users\\safva\\OneDrive\\Desktop\\starkin_projects\\recover-http\\Recovery\\lib\\script.dart".replaceAll(
      "\\",
      "/"
    );
  // console.log(process.env.PATH.replaceAll(";", "\n"));
  //   const dartScriptPath = __dirname + '\\Recovery\\lib\\script.dart';
  if (!fs.existsSync(dartScriptPath)) {
    console.error("Dart script file does not exist");
    return res.status(404).send("Dart script file not found");
  }

  // process.env.PATH += ";D:\\flutter_windows_3.13.9-stable\\flutter\\bin";
  // Spawn a new Dart process
  const dartProcess = spawn(
    "D:\\flutter_windows_3.13.9-stable\\flutter\\bin\\dart.bat",
    [dartScriptPath]
  );

  // Handle process events
  dartProcess.stdout.on("data", (data) => {
    console.log(`Dart script output: ${data}`);
  });

  dartProcess.stderr.on("error", (data) => {
    console.error(`Error from Dart script: ${data}`);
  });

  dartProcess.on("close", (code) => {
    console.log(`Dart script exited with code ${code}`);
    res.send("Dart script executed successfully!");
  });
});

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Use the agencyId from the request body and append the .png extension
    const fileName = `${req.body.agencyId}.png`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

app.post("/run", upload.single("logo"), async (req, res) => {
  const { name, agencyId, contact, address } = req.body;
  const iconImage = req.file; // Access the uploaded file

  console.log(`icon image path : ${iconImage.path}`);

  if (!fs.existsSync(iconImage.path)) {
    return res.status(500).send("Source file not found");
  }

  // Move the uploaded file to the desired location
  if (!iconImage || !iconImage.path) {
    return res.status(500).send("Uploaded file not found");
   }
   
   const targetDir = ensureDirectoryExists("Recovery\\assets\\icons"); 
   
   const targetPath = path.join(targetDir, "logo.png");
   try {
    fs.renameSync(iconImage.path, targetPath);
   } catch (err) {
    console.error(`Failed to rename file: ${err}`);
    return res.status(500).send("Failed to rename file");
   }

  await renameApp(name);
  await setAgencyDetails(name, targetPath, agencyId, contact, address);
  const child = fork("./long_task.js");
  var outputDir = ensureDirectoryExists(`apk/${agencyId}`);
  child.send({ command: "start", outputDir });
  child.on("message", (result) => {
    if (result.apkPath) {
      // Create a download link for the APK file
      const downloadLink = `${req.protocol}://${req.get(
        "host"
      )}/download?file=${encodeURIComponent(result.apkPath)}`;
      res.json({ success: true, downloadLink });
    } else {
      res.json(result);
    }
  });
});

app.get("/download", (req, res) => {
  const file = decodeURIComponent(req.query.file);
  res.download(file); // Set disposition and send it.
});

// app.post("/run", async (req, res) => {
//   const { name } = req.body;
//   await renameApp(name);
//   await setAgencyDetails(name, '', 1, "918888888", "india");
//   const child = fork("./long_task.js");
//   var outputDir = ensureDirectoryExists(`apk/${name}`)
//   child.send({ command: "start", outputDir });
//   child.on("message", (result) => {
//     res.json(result);
//   });
// });

function ensureDirectoryExists(folderPath) {
  console.log(`folder path : ${folderPath}`);
  const dir = path.join(__dirname, folderPath);
  // const dir = path.join(__dirname, folderPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
