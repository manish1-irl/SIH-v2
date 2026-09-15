import React from "react";
import { FinancialPlan } from "@/types";

interface FinancialDisplayProps {
  plan: FinancialPlan;
}

export function FinancialDisplay({ plan }: FinancialDisplayProps) {
  return (
    <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
      <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4">Deterministic Financial Architecture</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-antigravity-cream border border-antigravity-navy/10">
          <span className="font-sans text-xs text-antigravity-navy/70 block mb-1">Project Cost</span>
          <span className="font-serif text-xl font-bold text-antigravity-navy">₹{plan.project_cost.toLocaleString()}</span>
        </div>
        <div className="p-4 rounded-lg bg-antigravity-cream border border-antigravity-navy/10">
          <span className="font-sans text-xs text-antigravity-navy/70 block mb-1">Margin Money</span>
          <span className="font-serif text-xl font-bold text-antigravity-sage">₹{plan.margin_contribution.toLocaleString()}</span>
        </div>
        <div className="p-4 rounded-lg bg-antigravity-cream border border-antigravity-navy/10">
          <span className="font-sans text-xs text-antigravity-navy/70 block mb-1">Bank Loan</span>
          <span className="font-serif text-xl font-bold text-antigravity-orange">₹{plan.loan_requirement.toLocaleString()}</span>
        </div>
        <div className="p-4 rounded-lg bg-antigravity-cream border border-antigravity-navy/10">
          <span className="font-sans text-xs text-antigravity-navy/70 block mb-1">Monthly EMI</span>
          <span className="font-serif text-xl font-bold text-antigravity-navy">₹{plan.monthly_emi.toLocaleString()}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-antigravity-sage/10 border border-antigravity-sage/30">
          <span className="font-sans text-xs text-antigravity-navy/70 block">Break-Even</span>
          <span className="font-serif text-lg font-bold text-antigravity-sage">Month {plan.break_even_months}</span>
        </div>
        <div className="p-3 rounded-lg bg-antigravity-sage/10 border border-antigravity-sage/30">
          <span className="font-sans text-xs text-antigravity-navy/70 block">Moratorium</span>
          <span className="font-serif text-lg font-bold text-antigravity-sage">{plan.moratorium_months} months</span>
        </div>
        <div className="p-3 rounded-lg bg-antigravity-sage/10 border border-antigravity-sage/30">
          <span className="font-sans text-xs text-antigravity-navy/70 block">Total Repayment</span>
          <span className="font-serif text-lg font-bold text-antigravity-sage">₹{plan.total_repayment.toLocaleString()}</span>
        </div>
        <div className="p-3 rounded-lg bg-antigravity-sage/10 border border-antigravity-sage/30">
          <span className="font-sans text-xs text-antigravity-navy/70 block">Working Capital</span>
          <span className="font-serif text-lg font-bold text-antigravity-sage">₹{plan.working_capital.toLocaleString()}</span>
        </div>
      </div>
      <div>
        <h3 className="font-serif text-lg font-bold text-antigravity-navy mb-3">12-Month Cashflow Projection</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-antigravity-navy/10">
                <th className="text-left font-sans text-xs font-semibold text-antigravity-navy/70 py-2 px-3">Month</th>
                <th className="text-right font-sans text-xs font-semibold text-antigravity-navy/70 py-2 px-3">Revenue</th>
                <th className="text-right font-sans text-xs font-semibold text-antigravity-navy/70 py-2 px-3">OpEx</th>
                <th className="text-right font-sans text-xs font-semibold text-antigravity-navy/70 py-2 px-3">EMI</th>
                <th className="text-right font-sans text-xs font-semibold text-antigravity-navy/70 py-2 px-3">Net</th>
              </tr>
            </thead>
            <tbody>
              {plan.monthly_cashflow_projection.map((cf) => (
                <tr key={cf.month} className="border-b border-antigravity-navy/5 hover:bg-antigravity-cream/40">
                  <td className="py-2 px-3 font-sans text-xs text-antigravity-navy">
                    {cf.month}{cf.moratorium_active && <span className="ml-1 text-antigravity-sage text-[10px]">(Morat.)</span>}
                  </td>
                  <td className="py-2 px-3 text-right font-sans text-xs text-antigravity-navy">₹{cf.projected_revenue.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-sans text-xs text-antigravity-navy">₹{cf.operating_expenses.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-sans text-xs text-antigravity-navy">₹{cf.emi.toLocaleString()}</td>
                  <td className={`py-2 px-3 text-right font-sans text-xs font-semibold ${cf.net_profit >= 0 ? "text-antigravity-sage" : "text-red-500"}`}>
                    ₹{cf.net_profit.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
