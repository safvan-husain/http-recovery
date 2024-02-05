const fs = require("fs");
const xml2js = require("xml2js");

async function renameApp(name) {
  const manifestPath = "Recovery/android/app/src/main/AndroidManifest.xml";
  let manifestData = fs.readFileSync(manifestPath, "utf8");

  // Parse the XML data
  try {
    const result = await xml2js.parseStringPromise(manifestData);
    // Find the application node
    const applicationNode = result["manifest"]["application"][0];
    applicationNode["$"]["android:label"] = name;

    // Change the label attribute value
    // applicationNode['$'].label = name;

    // Convert back to XML string
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(result);

    // Write the updated XML back to the file
    fs.writeFileSync(manifestPath, xml);
  } catch (err) {
    console.error("Error parsing XML:", err);
  }
}
//this function will write new details into the json
async function setAgencyDetails(agencyName, image, id, contact, address) {
  const agencyDetailsJsonPath = "Recovery/assets/agency.json";
  let agencyDetails = {};

  // Read the existing JSON file
  try {
    const rawData = fs.readFileSync(agencyDetailsJsonPath, "utf8");
    agencyDetails = JSON.parse(rawData);
  } catch (err) {
    console.error("Error reading JSON file:", err);
    return;
  }

  // Update the values
  agencyDetails.id = id;
  agencyDetails.image = image;
  agencyDetails.agency_name = agencyName;
  agencyDetails.contact = contact;
  agencyDetails.address = address;

  // Convert the updated object back to JSON string
  const updatedJson = JSON.stringify(agencyDetails, null, 2);

  // Write the updated JSON back to the file
  try {
    fs.writeFileSync(agencyDetailsJsonPath, updatedJson);
    console.log("Agency details updated successfully.");
  } catch (err) {
    console.error("Error writing JSON file:", err);
  }
}

module.exports = { renameApp, setAgencyDetails };
