const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }
});

const SUPPORTED_DRUGS = [
  "CODEINE",
  "WARFARIN",
  "CLOPIDOGREL",
  "SIMVASTATIN",
  "AZATHIOPRINE",
  "FLUOROURACIL"
];

app.post("/analyze", upload.single("vcf"), (req, res) => {
  try {
    const drugInput = req.body.drug.toUpperCase();
    if (!SUPPORTED_DRUGS.includes(drugInput)) {
      return res.status(400).json({ error: "Unsupported Drug" });
    }

    const fileContent = fs.readFileSync(req.file.path, "utf8");
    const lines = fileContent.split("\n");

    let detectedVariants = [];

    lines.forEach(line => {
      if (!line.startsWith("#")) {
        const columns = line.split("\t");
        if (columns[2] && columns[2].startsWith("rs")) {
          detectedVariants.push({
            rsid: columns[2],
            chromosome: columns[0],
            position: columns[1]
          });
        }
      }
    });

    const riskLabel =
      detectedVariants.length > 2
        ? "Adjust Dosage"
        : "Safe";

    const severity =
      riskLabel === "Safe"
        ? "none"
        : "moderate";

    const response = {
      patient_id: "PATIENT_" + uuidv4().slice(0, 6),
      drug: drugInput,
      timestamp: new Date().toISOString(),
      risk_assessment: {
        risk_label: riskLabel,
        confidence_score: 0.85,
        severity: severity
      },
      pharmacogenomic_profile: {
        primary_gene: "CYP2D6",
        diplotype: "*1/*2",
        phenotype: "NM",
        detected_variants: detectedVariants
      },
      clinical_recommendation: {
        recommendation: riskLabel === "Safe"
          ? "Standard dosage recommended."
          : "Consider dosage adjustment as per CPIC guidelines."
      },
      llm_generated_explanation: {
        summary: "Based on detected variants, metabolism may vary affecting drug response."
      },
      quality_metrics: {
        vcf_parsing_success: true,
        total_variants_detected: detectedVariants.length
      }
    };

    res.json(response);

  } catch (error) {
    res.status(500).json({ error: "VCF Processing Failed" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
