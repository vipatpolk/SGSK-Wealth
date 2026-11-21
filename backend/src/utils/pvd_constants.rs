#[derive(Debug, Clone, Copy)]
pub struct DefaultPvdMetadata {
    pub policy_name: &'static str,
    pub aimc_type: &'static str,
    pub aimc_description: &'static str,
    pub risk_level: &'static str,
    pub objective: &'static str,
}

pub fn default_pvd_name(symbol_upper: &str) -> Option<&'static str> {
    match symbol_upper {
        "PVDSP500" => Some("นโยบายกองทุนรวมต่างประเทศ หุ้นยูเอส"),
        "PVDWEQ" => Some("นโยบายกองทุนรวมต่างประเทศ World Equity"),
        "PVDMPAEM" => Some("นโยบายกองทุนรวมตราสารทุน เอเชียน อีเมอร์จิ้ง"),
        "PVDMPINC" => Some("นโยบายกองทุนรวมตราสารหนี้ต่างประเทศ อินคัม"),
        "PVDMGLDH" => Some("นโยบายกองทุนรวมโกลด์ THB เฮดจ์"),
        _ => None,
    }
}

pub fn default_pvd_metadata(symbol_upper: &str) -> Option<DefaultPvdMetadata> {
    match symbol_upper {
        "PVDSP500" => Some(DefaultPvdMetadata {
            policy_name: "ตราสารทุนต่างประเทศ",
            aimc_type: "US Equity",
            aimc_description: "กองทุนรวมตราสารทุนสหรัฐอเมริกา",
            risk_level: "RS6",
            objective: "ลงทุนในกองทุนหลักต่างประเทศที่เน้นลงทุนในตราสารทุนสหรัฐอเมริกา (S&P 500)",
        }),
        "PVDWEQ" => Some(DefaultPvdMetadata {
            policy_name: "ตราสารทุนต่างประเทศ",
            aimc_type: "Global Equity",
            aimc_description: "กองทุนรวมตราสารทุนโลก",
            risk_level: "RS6",
            objective: "ลงทุนในกองทุนรวมตราสารทุนต่างประเทศทั่วโลก (World Equity)",
        }),
        "PVDMPAEM" => Some(DefaultPvdMetadata {
            policy_name: "ตราสารทุนต่างประเทศ",
            aimc_type: "Asia Pacific Ex Japan",
            aimc_description: "กองทุนรวมตราสารทุนภูมิภาคเอเชียและตลาดเกิดใหม่",
            risk_level: "RS6",
            objective: "ลงทุนในกองทุนรวมตราสารทุนภูมิภาคเอเชียและตลาดเกิดใหม่ (Asian Emerging Markets)",
        }),
        "PVDMPINC" => Some(DefaultPvdMetadata {
            policy_name: "ตราสารหนี้ต่างประเทศ",
            aimc_type: "Foreign Fixed Income",
            aimc_description: "กองทุนรวมตราสารหนี้ต่างประเทศ",
            risk_level: "RS4",
            objective: "ลงทุนในกองทุนรวมตราสารหนี้ต่างประเทศเพื่อสร้างผลตอบแทนและกระแสรายได้สม่ำเสมอ",
        }),
        "PVDMGLDH" => Some(DefaultPvdMetadata {
            policy_name: "สินทรัพย์ทางเลือก",
            aimc_type: "Commodities Precious Metals",
            aimc_description: "กองทุนรวมทองคำ (ป้องกันความเสี่ยงอัตราแลกเปลี่ยน)",
            risk_level: "RS8",
            objective:
                "ลงทุนในกองทุนรวมทองคำแท่งในต่างประเทศพร้อมป้องกันความเสี่ยงอัตราแลกเปลี่ยน (THB Hedged)",
        }),
        _ => None,
    }
}
