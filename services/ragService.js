import fs from "fs";
import path from "path";

const knowledgeMap = [
    {
  id: "salary-slip-extraction",
  file: "knowledge-base/documents/salary-slip-extraction.md",
  keywords: ["salary slip", "payslip", "basic salary", "net salary", "provident fund", "professional tax"],
},
{
  id: "form16-extraction",
  file: "knowledge-base/documents/form16-extraction.md",
  keywords: ["form 16", "form16", "tds", "employer tan", "tax certificate"],
},
{
  id: "ais-26as-matching",
  file: "knowledge-base/documents/ais-26as-matching.md",
  keywords: ["ais", "26as", "tds", "tax paid", "income reported"],
},
{
  id: "missing-upload-proofs",
  file: "knowledge-base/documents/missing-upload-proofs.md",
  keywords: ["missing document", "missing proof", "upload", "proof", "receipt"],
},
  {
    id: "government-hra",
    file: "knowledge-base/government/hra-rules.md",
    keywords: ["hra", "rent", "landlord", "metro", "non-metro"],
  },
  {
    id: "government-da-arrears",
    file: "knowledge-base/government/da-arrears-form-10e.md",
    keywords: ["da", "arrear", "arrears", "form 10e", "section 89", "relief"],
  },
  {
    id: "government-nps-80ccd2",
    file: "knowledge-base/government/nps-80ccd2.md",
    keywords: ["nps", "80ccd", "80ccd(2)", "employer contribution"],
  },
  {
    id: "old-vs-new-regime",
    file: "knowledge-base/common/old-vs-new-regime.md",
    keywords: ["old regime", "new regime", "regime", "tax regime"],
  },
  {
    id: "missing-proofs",
    file: "knowledge-base/common/missing-proofs.md",
    keywords: ["proof", "missing", "document", "upload", "receipt"],
  },
];

function readKnowledgeFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.readFileSync(fullPath, "utf-8");
}

export function retrieveKnowledge({ question = "", pageId = "" }) {
  const q = `${question} ${pageId}`.toLowerCase();

  const matches = knowledgeMap.filter((item) =>
    item.keywords.some((keyword) => q.includes(keyword))
  );

  const selected = matches.length > 0 ? matches : [knowledgeMap[4]];

  return selected.slice(0, 3).map((item) => ({
    id: item.id,
    content: readKnowledgeFile(item.file),
  }));
}