const payMatrix = {
  1: [18000, 18500, 19100, 19700, 20300],
  2: [19900, 20500, 21100, 21700, 22400],
  3: [21700, 22400, 23100, 23800, 24500],
  4: [25500, 26300, 27100, 27900, 28700],
  5: [29200, 30100, 31000, 31900, 32900],
  6: [35400, 36500, 37600, 38700, 39900],
  7: [44900, 46200, 47600, 49000, 50500],
  8: [47600, 49000, 50500, 52000, 53600],
  9: [53100, 54700, 56300, 58000, 59700],
  10: [56100, 57800, 59500, 61300, 63100],
  11: [67700, 69700, 71800, 74000, 76200],
  12: [78800, 81200, 83600, 86100, 88700],
};

export function calculateGovernmentSalary(input = {}) {
  const payLevel = Number(input.payLevel ?? 7);
  const payCell = Number(input.payCell ?? 3);
  const cityType = input.cityType ?? "Metro";
  const oldDa = Number(input.oldDa ?? 46);
  const newDa = Number(input.newDa ?? 50);
  const arrearMonths = Number(input.arrearMonths ?? 2);
  const transport = Number(input.transport ?? 3600);
  const ltc = Number(input.ltc ?? 0);
  const cea = Number(input.cea ?? 2400);
  const leaveEncashment = Number(input.leaveEncashment ?? 0);

  const basicPay = payMatrix[payLevel]?.[payCell - 1] || 47600;
  const daMonthly = Math.round((basicPay * newDa) / 100);
  const oldDaMonthly = Math.round((basicPay * oldDa) / 100);

  const hraRate = cityType === "Metro" ? 0.3 : cityType === "Tier 2" ? 0.2 : 0.1;
  const hraMonthly = Math.round(basicPay * hraRate);

  const npsEmployer = Math.round((basicPay + daMonthly) * 0.14);
  const arrearAmount = Math.max(0, (daMonthly - oldDaMonthly) * arrearMonths);

  const monthlyGross = basicPay + daMonthly + hraMonthly + transport;
  const annualGross = monthlyGross * 12 + arrearAmount + ltc + cea + leaveEncashment;

  const estimatedHraExemption = Math.min(hraMonthly * 12, 92000);
  const taxableEstimate = Math.max(
    0,
    annualGross - estimatedHraExemption - cea - npsEmployer * 12
  );

  const expectedRefund = Math.max(0, Math.round((annualGross - taxableEstimate) * 0.08));

  return {
    input: {
      payLevel,
      payCell,
      cityType,
      oldDa,
      newDa,
      arrearMonths,
      transport,
      ltc,
      cea,
      leaveEncashment,
    },
    salary: {
      basicPay,
      daMonthly,
      oldDaMonthly,
      hraMonthly,
      npsEmployer,
      arrearAmount,
      monthlyGross,
      annualGross,
      taxableEstimate,
      expectedRefund,
    },
    status: {
      riskScore: arrearAmount > 0 ? "Medium" : "Low",
      bestRegime: "Old Regime",
      alerts: [
        arrearAmount > 0 ? "DA arrear detected. Review Section 89 / Form 10E." : null,
        "HRA needs rent proof verification.",
        "Employer NPS should be checked in Form 16.",
      ].filter(Boolean),
    },
  };
}

export function calculateAllowanceReview(input = {}) {
  const basicPay = Number(input.basicPay ?? 47600);
  const da = Number(input.da ?? 23800);
  const hraReceived = Number(input.hraReceived ?? 14280);
  const rentPaid = Number(input.rentPaid ?? 22000);
  const cityType = input.cityType ?? "Metro";

  const ltcAmount = Number(input.ltcAmount ?? 30000);
  const ceaAmount = Number(input.ceaAmount ?? 6000);
  const children = Number(input.children ?? 2);
  const transportAmount = Number(input.transportAmount ?? 43200);
  const uniformAmount = Number(input.uniformAmount ?? 12000);
  const arrearAmount = Number(input.arrearAmount ?? 9520);

  const basicDaAnnual = (basicPay + da) * 12;
  const hraAnnual = hraReceived * 12;
  const rentAnnual = rentPaid * 12;
  const cityPercent = cityType === "Metro" ? 0.5 : 0.4;

  const hraRule1 = hraAnnual;
  const hraRule2 = Math.round(basicDaAnnual * cityPercent);
  const hraRule3 = Math.max(0, rentAnnual - Math.round(basicDaAnnual * 0.1));
  const hraExempt = Math.min(hraRule1, hraRule2, hraRule3);
  const hraTaxable = Math.max(0, hraAnnual - hraExempt);

  const ceaExempt = Math.min(ceaAmount, children * 1200);
  const ceaTaxable = Math.max(0, ceaAmount - ceaExempt);

  const ltcExempt = Math.min(ltcAmount, 24000);
  const ltcTaxable = Math.max(0, ltcAmount - ltcExempt);

  const uniformExempt = Math.min(uniformAmount, 8000);
  const uniformTaxable = Math.max(0, uniformAmount - uniformExempt);

  const rows = [
    {
      name: "HRA",
      received: hraAnnual,
      exempt: hraExempt,
      taxable: hraTaxable,
      status: "Partially Exempt",
      proof: "Rent receipt needed",
    },
    {
      name: "LTC / LTA",
      received: ltcAmount,
      exempt: ltcExempt,
      taxable: ltcTaxable,
      status: "Needs Proof",
      proof: "Travel proof needed",
    },
    {
      name: "Children Education Allowance",
      received: ceaAmount,
      exempt: ceaExempt,
      taxable: ceaTaxable,
      status: "Partially Exempt",
      proof: "Child details needed",
    },
    {
      name: "Transport Allowance",
      received: transportAmount,
      exempt: 0,
      taxable: transportAmount,
      status: "Taxable",
      proof: "No proof required",
    },
    {
      name: "Uniform / Special Allowance",
      received: uniformAmount,
      exempt: uniformExempt,
      taxable: uniformTaxable,
      status: "Partially Exempt",
      proof: "Expense proof needed",
    },
    {
      name: "DA Arrear",
      received: arrearAmount,
      exempt: 0,
      taxable: arrearAmount,
      status: "Section 89 Check",
      proof: "Form 10E review",
    },
  ];

  const totalReceived = rows.reduce((sum, row) => sum + row.received, 0);
  const totalExempt = rows.reduce((sum, row) => sum + row.exempt, 0);
  const totalTaxable = rows.reduce((sum, row) => sum + row.taxable, 0);

  return {
    hra: {
      hraRule1,
      hraRule2,
      hraRule3,
      hraExempt,
      hraTaxable,
    },
    rows,
    totals: {
      totalReceived,
      totalExempt,
      totalTaxable,
      proofsNeeded: rows.filter((row) => row.proof.toLowerCase().includes("needed")).length,
    },
    alerts: [
      "Rent proof required for HRA claim.",
      "LTC travel proof should be uploaded.",
      "DA arrear may need Section 89 / Form 10E review.",
    ],
  };
}

export function calculateDeductions(input = {}) {
  const grossSalary = Number(input.grossSalary ?? 1240000);
  const basicDaAnnual = Number(input.basicDaAnnual ?? (47600 + 23800) * 12);

  const section80C = Number(input.section80C ?? 110000);
  const section80D = Number(input.section80D ?? 18000);
  const section80CCD1B = Number(input.section80CCD1B ?? 30000);
  const employerNps = Number(input.employerNps ?? 119952);
  const homeLoanInterest = Number(input.homeLoanInterest ?? 60000);
  const educationLoanInterest = Number(input.educationLoanInterest ?? 0);
  const professionalTax = Number(input.professionalTax ?? 2500);

  const max80C = 150000;
  const max80D = 25000;
  const max80CCD1B = 50000;
  const maxEmployerNps = Math.round(basicDaAnnual * 0.14);

  const eligible80C = Math.min(section80C, max80C);
  const eligible80D = Math.min(section80D, max80D);
  const eligible80CCD1B = Math.min(section80CCD1B, max80CCD1B);
  const eligibleEmployerNps = Math.min(employerNps, maxEmployerNps);

  const totalEligible =
    eligible80C +
    eligible80D +
    eligible80CCD1B +
    eligibleEmployerNps +
    homeLoanInterest +
    educationLoanInterest +
    professionalTax;

  const taxableAfterDeductions = Math.max(0, grossSalary - totalEligible);
  const estimatedTaxSaved = Math.round(totalEligible * 0.2);

  return {
    eligible: {
      eligible80C,
      eligible80D,
      eligible80CCD1B,
      eligibleEmployerNps,
      homeLoanInterest,
      educationLoanInterest,
      professionalTax,
    },
    limits: {
      max80C,
      max80D,
      max80CCD1B,
      maxEmployerNps,
    },
    totals: {
      grossSalary,
      totalEligible,
      taxableAfterDeductions,
      estimatedTaxSaved,
    },
    alerts: [
      eligible80C < max80C ? `80C has ₹${max80C - eligible80C} unused.` : null,
      eligible80CCD1B < max80CCD1B
        ? `80CCD(1B) has ₹${max80CCD1B - eligible80CCD1B} unused.`
        : null,
      "Verify employer NPS under 80CCD(2) using Form 16.",
      "Upload medical insurance proof for 80D.",
    ].filter(Boolean),
  };
}

export function detectITRRisks(input = {}) {
  const risks = [
    {
      title: "HRA proof missing",
      severity: "Medium",
      impact: "HRA exemption may be questioned.",
      fix: "Upload rent receipts and landlord details.",
    },
    {
      title: "DA arrear detected",
      severity: "High",
      impact: "May need Section 89 / Form 10E review.",
      fix: "Confirm arrear period and payment month.",
    },
    {
      title: "NPS employer contribution needs verification",
      severity: "Medium",
      impact: "80CCD(2) deduction should match Form 16.",
      fix: "Verify employer NPS in Form 16 Part B.",
    },
    {
      title: "80D proof pending",
      severity: "Low",
      impact: "Medical insurance deduction needs proof.",
      fix: "Upload insurance premium receipt.",
    },
  ];

  return {
    overallRisk: "Medium",
    filingReadiness: 82,
    recommendedRegime: "Old Regime",
    risks,
    topFixes: risks.slice(0, 3),
  };
}