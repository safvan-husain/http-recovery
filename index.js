const { fork } = require("child_process");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { renameApp, setAgencyDetails } = require("./rename-app.js");
const app = express();
const port = 3000;
const multer = require("multer");

app.use(express.json());
const upload = multer({ dest: "uploads/" });

app.post("/run", upload.single("logo"), async (req, res) => {
  const { name, agencyId, contact, address } = req.body;
  const imageFile = req.file; // Access the uploaded file
  const targetImageDirectory = __dirname + "/Recovery/assets/icons";//I will add it later.

  try {
    await renameApp(name);
    await setAgencyDetails(name, agencyId, contact, address);
     // Move the image file to the target directory with the name logo.png
     const destinationPath = path.join(targetImageDirectory, 'logo.png');
     fs.rename(imageFile.path, destinationPath, (err) => {
       if (err) throw err;
       console.log('Image moved successfully!');
     });
  } catch (error) {
    console.log(error);
  }

  const child = fork("./long_task.js");
  var outputDir = ensureDirectoryExists(`apk/${name}`);
  child.send({ command: "start", outputDir });
  child.on("message", (result) => {
    if (result.apkPath) {
      // Create a download link for the APK file
      const downloadLink = `${req.protocol}://${req.get(
        "host"
      )}/download?file=${encodeURIComponent(result.apkPath)}`; 
      console.log(downloadLink);
      res.json({ success: true, downloadLink });
    } else {
      res.json(result);
    }
  });
});

app.get('/download', (req, res) => {
  // Extract the file name from the request query parameters
  const fileName = decodeURIComponent(req.query.file);
 
  // Check if the file exists
  if (fs.existsSync(fileName)) {
     // Set the appropriate headers for file download
     res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
     res.setHeader('Content-Type', 'application/octet-stream');
 
     // Stream the file content to the client
     const readStream = fs.createReadStream(fileName);
     readStream.pipe(res);
  } else {
     // Send a 404 Not Found status if the file does not exist
     res.status(404).send('File not found');
  }
 });

function ensureDirectoryExists(folderPath) {
  const dir = path.join(__dirname, folderPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
