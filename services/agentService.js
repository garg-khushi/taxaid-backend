import {
  calculateGovernmentSalary,
  calculateAllowanceReview,
  calculateDeductions,
  detectITRRisks,
} from "./taxCalculations.js";

export function answerWithFallbackAgent({ page, question, context = {} }) {
  const q = String(question || "").toLowerCase();

  if (q.includes("hra")) {
    const result = calculateAllowanceReview(context.allowance || {});
    return {
      answer: `Your HRA is partially exempt because TaxAid applies the least-of-three rule. Based on the current data, your HRA exemption is ₹${result.hra.hraExempt.toLocaleString(
        "en-IN"
      )}, and taxable HRA is ₹${result.hra.hraTaxable.toLocaleString("en-IN")}.`,
      suggestedActions: ["Upload rent receipts", "Confirm city type", "Verify rent paid"],
      toolUsed: "calculateAllowanceReview",
    };
  }

  if (q.includes("da") || q.includes("arrear") || q.includes("form 10e") || q.includes("89")) {
    const result = calculateGovernmentSalary(context.salary || {});
    return {
      answer: `A DA arrear of ₹${result.salary.arrearAmount.toLocaleString(
        "en-IN"
      )} is detected from the old and new DA rates. TaxAid recommends reviewing Section 89 / Form 10E eligibility before filing.`,
      suggestedActions: ["Confirm arrear months", "Check payment month", "Review Form 10E"],
      toolUsed: "calculateGovernmentSalary",
    };
  }

  if (q.includes("nps") || q.includes("80ccd")) {
    const result = calculateDeductions(context.deductions || {});
    return {
      answer: `Employer NPS under 80CCD(2) can be a high-value deduction. Based on your current data, eligible employer NPS is ₹${result.eligible.eligibleEmployerNps.toLocaleString(
        "en-IN"
      )}. Please verify it against Form 16.`,
      suggestedActions: ["Check Form 16 Part B", "Upload NPS statement", "Verify employer contribution"],
      toolUsed: "calculateDeductions",
    };
  }

  if (q.includes("regime") || q.includes("old") || q.includes("new")) {
    return {
      answer:
        "Old Regime currently looks better because your HRA exemption, employer NPS, 80C, 80D, and other deductions reduce taxable income significantly. New Regime may have lower slab rates, but many of your deductions are not available there.",
      suggestedActions: ["Review old vs new comparison", "Verify pending proofs", "Confirm final regime before filing"],
      toolUsed: "compareRegimesFallback",
    };
  }

  if (q.includes("risk") || q.includes("fix") || q.includes("missing")) {
    const result = detectITRRisks(context.risks || {});
    return {
      answer: `Your current filing risk is ${result.overallRisk}. The top issues are: ${result.topFixes
        .map((risk) => risk.title)
        .join(", ")}.`,
      suggestedActions: result.topFixes.map((risk) => risk.fix),
      toolUsed: "detectITRRisks",
    };
  }

  return {
    answer:
      "I can help explain your salary, HRA, DA arrears, deductions, regime choice, and filing risks. Ask me something like: “Why is old regime better?” or “Explain my HRA risk.”",
    suggestedActions: [
      "Ask about HRA exemption",
      "Ask about DA arrears",
      "Ask about Old vs New Regime",
    ],
    toolUsed: "fallbackAgent",
  };
}