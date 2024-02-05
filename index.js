const { spawn, fork } = require("child_process");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { renameApp, setAgencyDetails } = require("./rename-app.js");
const app = express();
const port = 3000;

app.use(express.json());


const multer = require("multer");
//I want to save the uploaded image with their agencyId, but I will only know it when they give request to /run route.
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
