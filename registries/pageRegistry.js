export const pageRegistry = {
  "government-salary-builder": {
    module: "file-itr",
    tools: ["calculateGovernmentSalary"],
    ragNamespaces: ["government-hra", "government-da-arrears", "government-nps-80ccd2"],
    nextPage: "itr-allowance-review",
  },

  "allowance-review": {
    module: "file-itr",
    tools: ["calculateAllowanceReview"],
    ragNamespaces: ["government-hra", "missing-proofs"],
    nextPage: "itr-deduction-optimizer",
  },

  "deduction-optimizer": {
    module: "file-itr",
    tools: ["calculateDeductions"],
    ragNamespaces: ["government-nps-80ccd2", "missing-proofs"],
    nextPage: "itr-ai-risk-check",
  },

  "itr-ai-risk-check": {
    module: "file-itr",
    tools: ["detectITRRisks"],
    ragNamespaces: ["missing-proofs", "old-vs-new-regime"],
    nextPage: "itr-final-tax-report",
  },

  "final-tax-report": {
    module: "file-itr",
    tools: ["detectITRRisks", "calculateDeductions"],
    ragNamespaces: ["old-vs-new-regime", "missing-proofs"],
    nextPage: null,
  },

  "investment-risk-profile": {
    module: "risk-assessment",
    tools: [],
    ragNamespaces: [],
    nextPage: "portfolio-analysis",
  },

  "what-if-simulation": {
    module: "risk-assessment",
    tools: [],
    ragNamespaces: [],
    nextPage: "financial-action-plan",
  },
  "upload-autofill": {
  module: "file-itr",
  tools: ["analyzeUploadedDocuments"],
  ragNamespaces: [
    "document-upload",
    "salary-slip",
    "form16",
    "missing-proofs"
  ],
  nextPage: "itr-guided-filing",
},
};