export {
  ASSET_TABS,
  DIVIDEND_ASSET_TYPES,
  KNOWN_ASSET_TYPES,
} from '../../../packages/domain/src/asset.constants';
export type { AssetTab, AssetType } from '../../../packages/domain/src/asset.constants';

export type AppView =
  | 'dashboard'
  | 'holdings'
  | 'transactions'
  | 'analytics'
  | 'allocation'
  | 'performance'
  | 'dividends'
  | 'tools';

export type AnalyticsSubTab = 'overview' | 'allocation' | 'performance';

export type HoldingsSubTab = 'market' | 'pvd';
