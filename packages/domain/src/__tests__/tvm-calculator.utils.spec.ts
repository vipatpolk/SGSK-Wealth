import { describe, it, expect } from 'vitest';
import {
  calculateAnnualRate,
  calculateFutureValue,
  calculatePayment,
  calculatePeriodsInYears,
  calculatePresentValue,
  calculateTVM,
  generateTvmSchedule,
  getCompoundingPeriodsPerYear,
} from '../tvm-calculator.utils';

describe('tvm-calculator.utils', () => {
  it('should return correct compounding periods per year for all 8 frequencies', () => {
    expect(getCompoundingPeriodsPerYear('daily')).toBe(365);
    expect(getCompoundingPeriodsPerYear('weekly')).toBe(52);
    expect(getCompoundingPeriodsPerYear('biweekly')).toBe(26);
    expect(getCompoundingPeriodsPerYear('semimonthly')).toBe(24);
    expect(getCompoundingPeriodsPerYear('monthly')).toBe(12);
    expect(getCompoundingPeriodsPerYear('quarterly')).toBe(4);
    expect(getCompoundingPeriodsPerYear('semiannually')).toBe(2);
    expect(getCompoundingPeriodsPerYear('annually')).toBe(1);
  });

  describe('calculateFutureValue', () => {
    it('should compute future value for lump-sum PV only (no PMT)', () => {
      const fv = calculateFutureValue(10000, 0, 8, 10, 'annually');
      expect(fv).toBeCloseTo(21589.25, 1);
    });

    it('should compute future value for monthly PMT with zero PV', () => {
      const fv = calculateFutureValue(0, 500, 6, 5, 'monthly');
      expect(fv).toBeCloseTo(34885.02, 1);
    });

    it('should compute combined PV and PMT future value (Ordinary Annuity)', () => {
      const fv = calculateFutureValue(5000, 200, 10, 10, 'monthly', 'end');
      expect(fv).toBeCloseTo(54504.20, 0);
    });

    it('should compute combined PV and PMT future value (Annuity Due)', () => {
      const fvEnd = calculateFutureValue(5000, 200, 10, 10, 'monthly', 'end');
      const fvDue = calculateFutureValue(5000, 200, 10, 10, 'monthly', 'beginning');
      expect(fvDue).toBeGreaterThan(fvEnd);
    });

    it('should handle 0% return rate correctly as linear sum', () => {
      const fv = calculateFutureValue(10000, 1000, 0, 5, 'monthly');
      expect(fv).toBe(10000 + 1000 * 60);
    });
  });

  describe('calculatePresentValue', () => {
    it('should solve for required PV given target FV', () => {
      const targetFv = 100000;
      const pmt = 500;
      const rate = 8;
      const years = 10;
      const compounding = 'monthly';

      const pv = calculatePresentValue(targetFv, pmt, rate, years, compounding);
      const recomputedFv = calculateFutureValue(pv, pmt, rate, years, compounding);
      expect(recomputedFv).toBeCloseTo(targetFv, 0);
    });
  });

  describe('calculatePayment', () => {
    it('should solve for required periodic PMT given target FV and PV', () => {
      const targetFv = 1000000;
      const pv = 50000;
      const rate = 7;
      const years = 20;
      const compounding = 'monthly';

      const pmt = calculatePayment(targetFv, pv, rate, years, compounding);
      const recomputedFv = calculateFutureValue(pv, pmt, rate, years, compounding);
      expect(recomputedFv).toBeCloseTo(targetFv, 0);
    });
  });

  describe('calculatePeriodsInYears', () => {
    it('should solve for required investment horizon in years', () => {
      const targetFv = 500000;
      const pv = 20000;
      const pmt = 1000;
      const rate = 8;
      const compounding = 'monthly';

      const { years, isValid } = calculatePeriodsInYears(targetFv, pv, pmt, rate, compounding);
      expect(isValid).toBe(true);
      const recomputedFv = calculateFutureValue(pv, pmt, rate, years, compounding);
      expect(recomputedFv).toBeCloseTo(targetFv, 0);
    });
  });

  describe('calculateAnnualRate', () => {
    it('should solve for required return rate (%)', () => {
      const targetFv = 1000000;
      const pv = 100000;
      const pmt = 2000;
      const years = 15;
      const compounding = 'monthly';

      const { annualRatePct, isValid } = calculateAnnualRate(targetFv, pv, pmt, years, compounding);
      expect(isValid).toBe(true);
      expect(annualRatePct).toBeGreaterThan(0);
      const recomputedFv = calculateFutureValue(pv, pmt, annualRatePct, years, compounding);
      expect(recomputedFv).toBeCloseTo(targetFv, -1);
    });
  });

  describe('generateTvmSchedule', () => {
    it('should generate accurate year-by-year schedule', () => {
      const schedule = generateTvmSchedule(10000, 500, 10, 5, 'monthly', 'end');
      expect(schedule.length).toBe(5);
      expect(schedule[0].year).toBe(1);
      expect(schedule[0].startBalance).toBe(10000);
      expect(schedule[0].contributions).toBe(500 * 12);
      expect(schedule[4].year).toBe(5);
      expect(schedule[4].endBalance).toBeCloseTo(calculateFutureValue(10000, 500, 10, 5, 'monthly'), 1);
    });
  });

  describe('calculateTVM master function', () => {
    it('should return complete structured result with metrics', () => {
      const res = calculateTVM({
        mode: 'FV',
        presentValue: 100000,
        payment: 5000,
        annualRatePct: 8,
        years: 10,
        compounding: 'monthly',
        timing: 'end',
      });

      expect(res.isValid).toBe(true);
      expect(res.futureValue).toBeGreaterThan(res.totalInvested);
      expect(res.totalPrincipal).toBe(100000);
      expect(res.totalContributions).toBe(5000 * 120);
      expect(res.totalInterestEarned).toBeCloseTo(res.futureValue - res.totalInvested, 1);
      expect(res.effectiveAnnualRatePct).toBeCloseTo(8.30, 1);
      expect(res.schedule.length).toBe(10);
    });
  });
});
