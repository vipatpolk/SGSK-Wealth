export function getQuantityFormat(symbol: string): string {
  return symbol.endsWith('.CRYPTO') ? '1.0-10' : '1.0-7';
}

export function displaySymbol(symbol: string): string {
  return symbol.replace(/\.(BK|CRYPTO)$/, '');
}

export function getPriceFormat(symbol: string): string {
  return symbol.endsWith('.CRYPTO') ? '1.2-2' : '1.2-4';
}

export function getSymbolColor(symbol: string): string {
  const colors: Record<string, string> = {
    // U.S. Stocks
    VOO: '#6366f1', GOOGL: '#10b981', NVDA: '#84cc16', JEPI: '#f59e0b',
    SCHD: '#06b6d4', VXUS: '#8b5cf6', O: '#ec4899', TSM: '#14b8a6',
    AVGO: '#f43f5e', LLY: '#a855f7', COST: '#0ea5e9', KO: '#ef4444',
    MU: '#22c55e', GPIQ: '#eab308', BNDW: '#64748b',
    // Thai Stocks
    'PTT.BK': '#3b82f6', 'HMPRO.BK': '#f97316', 'WHA.BK': '#14b8a6',
    'TRUE.BK': '#ef4444', 'GULF.BK': '#6366f1', 'SCB.BK': '#8b5cf6',
    'KTB.BK': '#06b6d4', 'ICHI.BK': '#ec4899', 'KKP.BK': '#10b981',
    // Crypto
    'BTC.CRYPTO': '#f7931a', 'PAXG.CRYPTO': '#e6b800',
  };
  return colors[symbol] || '#6366f1';
}

export function getSymbolName(symbol: string, rawName: string = ''): string {
  let name = rawName;
  if (symbol.endsWith('.BK')) {
    const prefix = symbol.replace('.BK', '').toUpperCase() + '_';
    if (name.toUpperCase().startsWith(prefix)) {
      name = name.substring(prefix.length);
    }
  }
  
  // Convert to Proper Case
  return name.split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
