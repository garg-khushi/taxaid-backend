import { retrieveKnowledge } from "./ragService.js";
import { runToolsForPage } from "./toolRegistry.js";
import { pageRegistry } from "../registries/pageRegistry.js";

function buildAnswer({ question, pageId, toolResults, retrievedKnowledge }) {
  const q = question.toLowerCase();

  if (q.includes("hra")) {
    const hra = toolResults.allowanceReview?.hra;

    return `Your HRA is checked using the least-of-three rule: actual HRA received, city-rate percentage of Basic plus DA, and rent paid minus 10% of Basic plus DA. Based on your current values, your HRA exemption is ₹${(
      hra?.hraExempt ?? 0
    ).toLocaleString("en-IN")} and taxable HRA is ₹${(
      hra?.hraTaxable ?? 0
    ).toLocaleString("en-IN")}. Rent proof should be uploaded to reduce filing risk.`;
  }

  if (q.includes("da") || q.includes("arrear") || q.includes("form 10e") || q.includes("89")) {
    const salary = toolResults.governmentSalary?.salary;

    return `TaxAid detected a possible DA arrear of ₹${(
      salary?.arrearAmount ?? 0
    ).toLocaleString("en-IN")}. DA arrears can affect taxable salary in the year of receipt, so TaxAid recommends checking Section 89 / Form 10E before filing.`;
  }

  if (q.includes("nps") || q.includes("80ccd")) {
    const deductions = toolResults.deductions?.eligible;

    return `Employer NPS under 80CCD(2) can be a high-value deduction. Based on the current data, eligible employer NPS is ₹${(
      deductions?.eligibleEmployerNps ?? 0
    ).toLocaleString("en-IN")}. Verify this with Form 16 before final filing.`;
  }

  if (q.includes("regime") || q.includes("old") || q.includes("new")) {
    return "Old Regime currently looks better because your HRA exemption, NPS employer contribution, 80C, 80D, and other deductions reduce taxable income significantly. New Regime may still be reviewed, but deductions are limited there.";
  }

  if (q.includes("fix") || q.includes("risk") || q.includes("missing")) {
    const risks = toolResults.risks?.topFixes || [];

    if (risks.length > 0) {
      return `Your top filing fixes are: ${risks
        .map((item, index) => `${index + 1}. ${item.title}`)
        .join(" ")}. Fixing these will improve filing readiness.`;
    }

    return "TaxAid recommends checking missing proofs, DA arrears, HRA documents, and NPS verification before final filing.";
  }

  const page = pageRegistry[pageId];

  return `I reviewed this page using TaxAid's agent tools and tax-rule knowledge base. You can ask me to explain HRA, DA arrears, NPS deductions, old vs new regime, missing proofs, or what to fix next.${
    page?.nextPage ? ` The next recommended step is ${page.nextPage}.` : ""
  }`;
}

function buildSuggestedActions({ question, toolResults }) {
  const q = question.toLowerCase();

  if (q.includes("hra")) {
    return ["Upload rent receipts", "Confirm city type", "Verify monthly rent paid"];
  }

  if (q.includes("da") || q.includes("arrear")) {
    return ["Confirm old and new DA rate", "Confirm arrear months", "Review Form 10E"];
  }

  if (q.includes("nps") || q.includes("80ccd")) {
    return ["Check Form 16 Part B", "Verify employer NPS", "Upload NPS statement"];
  }

  if (toolResults.risks?.topFixes) {
    return toolResults.risks.topFixes.map((item) => item.fix);
  }

  return ["Review missing proofs", "Check regime comparison", "Continue to the next filing step"];
}

export function handleAgentMessage({ pageId, question, context = {} }) {
  const page = pageRegistry[pageId] || {};
  const retrievedKnowledge = retrieveKnowledge({ question, pageId });
  const { toolCalls, toolResults } = runToolsForPage({ pageId, question, context });

  const answer = buildAnswer({
    question,
    pageId,
    toolResults,
    retrievedKnowledge,
  });

  const suggestedActions = buildSuggestedActions({
    question,
    toolResults,
  });

  return {
    answer,
    pageId,
    module: page.module || "unknown",
    toolCalls,
    retrievedRules: retrievedKnowledge.map((item) => item.id),
    suggestedActions,
    nextPage: page.nextPage || null,
    confidence: 0.86,
    debug: {
      toolResults,
    },
  };
}