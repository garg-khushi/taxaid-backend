import {
  calculateGovernmentSalary,
  calculateAllowanceReview,
  calculateDeductions,
  detectITRRisks,
} from "./taxCalculations.js";

export function runToolsForPage({ pageId, context = {}, question = "" }) {
  const q = question.toLowerCase();
  const toolCalls = [];
  const toolResults = {};

  if (
    pageId === "government-salary-builder" ||
    q.includes("da") ||
    q.includes("arrear") ||
    q.includes("salary")
  ) {
    toolResults.governmentSalary = calculateGovernmentSalary(context.salary || {});
    toolCalls.push("calculateGovernmentSalary");
  }

  if (
    pageId === "allowance-review" ||
    q.includes("hra") ||
    q.includes("rent") ||
    q.includes("allowance")
  ) {
    toolResults.allowanceReview = calculateAllowanceReview(context.allowance || {});
    toolCalls.push("calculateAllowanceReview");
  }

  if (
    pageId === "deduction-optimizer" ||
    q.includes("nps") ||
    q.includes("80c") ||
    q.includes("80d") ||
    q.includes("80ccd") ||
    q.includes("deduction")
  ) {
    toolResults.deductions = calculateDeductions(context.deductions || {});
    toolCalls.push("calculateDeductions");
  }

  if (
    pageId === "itr-ai-risk-check" ||
    q.includes("risk") ||
    q.includes("missing") ||
    q.includes("fix") ||
    q.includes("proof")
  ) {
    toolResults.risks = detectITRRisks(context.risks || {});
    toolCalls.push("detectITRRisks");
  }

  return {
    toolCalls,
    toolResults,
  };
}