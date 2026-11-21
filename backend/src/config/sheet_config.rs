use crate::config::settings::Settings;

#[derive(Debug, Clone, Copy)]
pub struct AssetTab {
    pub id: &'static str,
    pub label: &'static str,
    pub sheet_gid: &'static str,
    pub currency: &'static str,
}

pub const ASSET_TABS: &[AssetTab] = &[
    AssetTab {
        id: "all",
        label: "All",
        sheet_gid: "",
        currency: "",
    },
    AssetTab {
        id: "us-stock",
        label: "U.S. Stock",
        sheet_gid: "1032243687",
        currency: "USD",
    },
    AssetTab {
        id: "thai-stock",
        label: "Thai Stock",
        sheet_gid: "102823823",
        currency: "THB",
    },
    AssetTab {
        id: "crypto",
        label: "Cryptocurrency",
        sheet_gid: "1822302220",
        currency: "THB",
    },
    AssetTab {
        id: "mutual-fund",
        label: "Mutual Fund",
        sheet_gid: "359978839",
        currency: "THB",
    },
    AssetTab {
        id: "bond",
        label: "Bond",
        sheet_gid: "1657887056",
        currency: "USD",
    },
    AssetTab {
        id: "provident-fund",
        label: "Provident Fund",
        sheet_gid: "0",
        currency: "THB",
    },
    AssetTab {
        id: "closed-position",
        label: "Closed Position",
        sheet_gid: "273600915",
        currency: "",
    },
];

pub fn find_asset_tab(tab_id: &str) -> Option<&'static AssetTab> {
    ASSET_TABS.iter().find(|t| t.id == tab_id)
}

pub fn get_sheet_export_url(
    settings: &Settings,
    gid: &str,
    tab_id: Option<&str>,
    spreadsheet_id: Option<&str>,
) -> String {
    let sheet_id = match spreadsheet_id {
        Some(id) if !id.is_empty() => id,
        _ => {
            if tab_id == Some("provident-fund") {
                settings.google_pvd_spreadsheet_id.as_str()
            } else {
                settings.google_spreadsheet_id.as_str()
            }
        }
    };
    let base = settings.sheets_base_url.trim_end_matches('/');
    format!("{base}/{sheet_id}/export?format=csv&gid={gid}")
}
