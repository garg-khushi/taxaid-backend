import { retrieveKnowledge } from "./ragService.js";
import { runToolsForPage } from "./toolRegistry.js";
import { pageRegistry } from "../registries/pageRegistry.js";

function buildAnswer({ question, pageId, toolResults }) {
  const q = question.toLowerCase();

  if (pageId === "upload-autofill") {
    const upload = toolResults.uploadAnalysis || {};
    const detectedCategory = upload.detectedCategory || "the detected employment category";
    const confidence = upload.confidence || 0;
    const matchedCount = upload.matchedCount || 0;
    const reviewCount = upload.reviewCount || 0;
    const extracted = upload.extracted || {};

    if (
      q.includes("detect") ||
      q.includes("government") ||
      q.includes("private") ||
      q.includes("category")
    ) {
      return `TaxAid detected ${detectedCategory} with ${confidence}% confidence based on the uploaded document structure and extracted salary fields. ${
        detectedCategory.includes("Government")
          ? "Government-style indicators such as Pay Level, Pay Cell, DA structure, or government employer data were found."
          : "Private-sector indicators such as Basic Salary, HRA, PF, Professional Tax, net salary, and company payroll-style fields were found."
      }`;
    }

    if (q.includes("match") || q.includes("document") || q.includes("source")) {
      return `TaxAid found ${matchedCount} usable document source(s). It compared extracted values against available document fields and profession-aware rules. ${reviewCount} value(s) may still need review before continuing.`;
    }

    if (q.includes("review") || q.includes("fix") || q.includes("missing")) {
      return `Before continuing, review any fields marked as Needs Review, confirm the detected employment category, and upload Form 16 or 26AS if TDS is missing. For salary slips, TaxAid checks Basic Salary, HRA, PF, Professional Tax, total earnings, and net salary.`;
    }

    if (q.includes("salary") || q.includes("hra") || q.includes("pf") || q.includes("net")) {
      return `From the uploaded documents, TaxAid extracted salary-related values such as Basic Salary ₹${Number(
        extracted.basicPay || 0
      ).toLocaleString("en-IN")}, HRA ₹${Number(
        extracted.houseRentAllowance || 0
      ).toLocaleString("en-IN")}, PF ₹${Number(
        extracted.providentFund || 0
      ).toLocaleString("en-IN")}, and Net Salary ₹${Number(
        extracted.netSalary || 0
      ).toLocaleString("en-IN")}.`;
    }

    return `I reviewed your uploaded documents. TaxAid detected ${detectedCategory} with ${confidence}% confidence, found ${matchedCount} usable source(s), and marked ${reviewCount} value(s) for review.`;
  }

  if (pageId === "itr-private-salary-builder") {
    const upload = toolResults.privateSalaryAnalysis || {};
    const extracted = upload.extracted || {};
    const salary = upload.salaryProfile || {};
    const deductions = upload.deductionProfile || {};
    const missing = upload.missingDataProfile || {};

    if (q.includes("ctc") || q.includes("salary structure") || q.includes("explain")) {
      return `Your private-sector salary structure was built from uploaded documents. TaxAid detected Basic Salary ₹${Number(
        salary.monthly?.basicSalary || 0
      ).toLocaleString("en-IN")}, HRA ₹${Number(
        salary.monthly?.houseRentAllowance || 0
      ).toLocaleString("en-IN")}, Performance Pay ₹${Number(
        salary.monthly?.performanceLinkedPay || 0
      ).toLocaleString("en-IN")}, and Net Salary ₹${Number(
        salary.monthly?.netSalary || 0
      ).toLocaleString("en-IN")} per month.`;
    }

    if (q.includes("hra")) {
      return `TaxAid found monthly HRA of ₹${Number(
        salary.monthly?.houseRentAllowance || extracted.houseRentAllowance || 0
      ).toLocaleString("en-IN")}. To safely claim HRA exemption, rent receipts and landlord details should be uploaded.`;
    }

    if (q.includes("pf") || q.includes("epf")) {
      return `TaxAid detected Provident Fund of ₹${Number(
        deductions.providentFund || 0
      ).toLocaleString("en-IN")} per month from your salary slip. This can contribute to eligible deduction tracking, but Form 16 should verify the annual deduction.`;
    }

    if (q.includes("form 16") || q.includes("26as") || q.includes("tds")) {
      return `Form 16 or Form 26AS is needed because your salary slip does not fully verify annual taxable salary and TDS. TaxAid has marked tax-paid verification as incomplete until Form 16, AIS, or 26AS is uploaded.`;
    }

    if (q.includes("rsu") || q.includes("esop")) {
      return `No RSU or ESOP proof was detected in the uploaded documents. If you received stock compensation, upload your RSU/ESOP statement so TaxAid can check perquisite value, disclosure needs, and tax treatment.`;
    }

    if (q.includes("missing") || q.includes("proof") || q.includes("review")) {
      const items = missing.missing || [];

      if (items.length > 0) {
        return `TaxAid found ${items.length} missing proof item(s): ${items
          .map((item) => item.item)
          .join(", ")}. Uploading these will improve your filing readiness.`;
      }

      return "No major missing proof was detected. You can continue to salary optimization.";
    }

    return "I reviewed your private-sector salary profile. TaxAid has built your salary components, detected deductions, checked proof gaps, and prepared the next optimization step.";
  }

  if (q.includes("hra")) {
    const hra = toolResults.allowanceReview?.hra;

    return `Your HRA is checked using the least-of-three rule. Based on your current values, your HRA exemption is ₹${(
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
    return "Old Regime currently looks better because HRA exemption, NPS employer contribution, 80C, 80D, and other deductions can reduce taxable income significantly. New Regime may still be reviewed, but deductions are limited there.";
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

function buildSuggestedActions({ question, toolResults, pageId }) {
  const q = question.toLowerCase();

  if (pageId === "upload-autofill") {
    const upload = toolResults.uploadAnalysis || {};
    const detectedCategory = upload.detectedCategory || "";
    const reviewCount = upload.reviewCount || 0;
    const extracted = upload.extracted || {};

    if (q.includes("detect") || q.includes("category")) {
      return [
        "Confirm detected employment category",
        detectedCategory.includes("Private")
          ? "Continue to Private Sector Salary Builder"
          : detectedCategory.includes("Government")
          ? "Continue to Government Salary Builder"
          : "Review category manually",
        "Upload Form 16 or 26AS for stronger verification",
      ];
    }

    if (q.includes("match") || q.includes("document") || q.includes("source")) {
      return [
        "Review extracted vs calculated table",
        "Upload missing Form 16 / AIS / 26AS if available",
        reviewCount > 0 ? "Fix fields marked Needs Review" : "Proceed to detected filing flow",
      ];
    }

    if (q.includes("missing") || q.includes("proof") || q.includes("review") || q.includes("fix")) {
      return [
        extracted.taxDeductedAtSource ? "TDS proof detected" : "Upload Form 16 or Form 26AS",
        extracted.monthlyRentPaid ? "Rent proof detected" : "Upload rent receipts if claiming HRA",
        extracted.employerNps ? "NPS proof detected" : "Upload NPS statement if claiming 80CCD",
      ];
    }

    return [
      "Confirm extracted salary fields",
      "Review missing proof alerts",
      "Continue to the recommended filing flow",
    ];
  }

  if (pageId === "itr-private-salary-builder") {
    return [
      "Upload Form 16 or 26AS for TDS verification",
      "Upload rent receipts if claiming HRA",
      "Continue to private salary optimization",
    ];
  }

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
  const { toolCalls, toolResults } = runToolsForPage({
    pageId,
    question,
    context,
  });

  if (pageId === "upload-autofill" && context.upload) {
    toolResults.uploadAnalysis = {
      detectedCategory: context.upload.employmentDetection?.category,
      confidence: Math.round((context.upload.employmentDetection?.confidence || 0) * 100),
      matchedCount: context.upload.matchedSources?.length || 0,
      reviewCount: context.upload.comparisonResult?.mismatchCount || 0,
      extracted: context.upload.extractedInsights?.extracted || {},
    };

    toolCalls.push("analyzeUploadedDocuments");
  }

  if (pageId === "itr-private-salary-builder" && context.upload) {
    toolResults.privateSalaryAnalysis = {
      salaryProfile: context.upload.salaryProfile || {},
      deductionProfile: context.upload.deductionProfile || {},
      taxPaidProfile: context.upload.taxPaidProfile || {},
      proofProfile: context.upload.proofProfile || {},
      missingDataProfile: context.upload.missingDataProfile || {},
      extracted: context.upload.extractedInsights?.extracted || {},
    };

    toolCalls.push("analyzePrivateSalary");
  }

  const answer = buildAnswer({
    question,
    pageId,
    toolResults,
    retrievedKnowledge,
  });

  const suggestedActions = buildSuggestedActions({
    question,
    toolResults,
    pageId,
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