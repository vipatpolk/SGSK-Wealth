from pydantic import BaseModel, Field


class FactsheetFeeItem(BaseModel):
    description: str
    ceilingRate: str | None = None
    actualRate: str | None = None
    note: str | None = None


class FactsheetPerformanceItem(BaseModel):
    category: str
    period: str
    value: float | None = None


class FactsheetAllocationItem(BaseModel):
    seq: int
    name: str
    ratio: float


class FactsheetHoldingItem(BaseModel):
    seq: int
    name: str
    ratio: float
    creditRating: str | None = None
    isin: str | None = None


class FactsheetStatistics(BaseModel):
    maxDrawdown: float | None = None
    sharpeRatio: float | None = None
    trackingError: float | None = None
    fxHedging: str | None = None
    turnoverRatio: float | None = None
    beta: float | None = None
    alpha: float | None = None
    yieldToMaturity: float | None = None
    portfolioDuration: str | None = None
    recoveringPeriod: str | None = None


class FactsheetTradeConditions(BaseModel):
    minimumInitialSub: float | None = None
    minimumNextSub: float | None = None
    minimumRedempt: float | None = None
    currency: str | None = None
    subscriptionPeriod: str | None = None
    redemptionPeriod: str | None = None
    settlementPeriod: str | None = None


class FundFactsheetResponse(BaseModel):
    symbol: str
    displaySymbol: str
    assetType: str
    projId: str | None = None
    fundName: str | None = None
    fundNameTh: str | None = None
    amcName: str | None = None
    amcNameTh: str | None = None
    fundClassName: str | None = None
    policyDesc: str | None = None
    investmentPolicyDesc: str | None = None
    managementStyle: str | None = None
    objective: str | None = None
    aimcType: str | None = None
    aimcDescription: str | None = None
    riskLevel: str | None = None
    riskDescription: str | None = None
    benchmark: str | None = None
    benchmarkRemark: str | None = None
    dividendPolicy: str | None = None
    inceptionDate: str | None = None
    pdfUrl: str | None = None
    amcUrl: str | None = None
    asOfDate: str | None = None
    feederMasterFund: str | None = None
    feederCountry: str | None = None
    fxHedgingPolicy: str | None = None
    taxIncentiveType: str | None = None
    isinCode: str | None = None
    fees: list[FactsheetFeeItem] = Field(default_factory=list)
    performance: list[FactsheetPerformanceItem] = Field(default_factory=list)
    statistics: FactsheetStatistics | None = None
    assetAllocation: list[FactsheetAllocationItem] = Field(default_factory=list)
    topHoldings: list[FactsheetHoldingItem] = Field(default_factory=list)
    tradeConditions: FactsheetTradeConditions | None = None
