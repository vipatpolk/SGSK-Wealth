DEFAULT_PVD_NAMES: dict[str, str] = {
    "PVDSP500": "นโยบายกองทุนรวมต่างประเทศ หุ้นยูเอส",
    "PVDWEQ": "นโยบายกองทุนรวมต่างประเทศ World Equity",
    "PVDMPAEM": "นโยบายกองทุนรวมตราสารทุน เอเชียน อีเมอร์จิ้ง",
    "PVDMPINC": "นโยบายกองทุนรวมตราสารหนี้ต่างประเทศ อินคัม",
    "PVDMGLDH": "นโยบายกองทุนรวมโกลด์ THB เฮดจ์",
}

DEFAULT_PVD_METADATA: dict[str, dict[str, str]] = {
    "PVDSP500": {
        "policyName": "ตราสารทุนต่างประเทศ",
        "aimcType": "US Equity",
        "aimcDescription": "กองทุนรวมตราสารทุนสหรัฐอเมริกา",
        "riskLevel": "RS6",
        "objective": "ลงทุนในกองทุนหลักต่างประเทศที่เน้นลงทุนในตราสารทุนสหรัฐอเมริกา (S&P 500)",
    },
    "PVDWEQ": {
        "policyName": "ตราสารทุนต่างประเทศ",
        "aimcType": "Global Equity",
        "aimcDescription": "กองทุนรวมตราสารทุนโลก",
        "riskLevel": "RS6",
        "objective": "ลงทุนในกองทุนรวมตราสารทุนต่างประเทศทั่วโลก (World Equity)",
    },
    "PVDMPAEM": {
        "policyName": "ตราสารทุนต่างประเทศ",
        "aimcType": "Asia Pacific Ex Japan",
        "aimcDescription": "กองทุนรวมตราสารทุนภูมิภาคเอเชียและตลาดเกิดใหม่",
        "riskLevel": "RS6",
        "objective": "ลงทุนในกองทุนรวมตราสารทุนภูมิภาคเอเชียและตลาดเกิดใหม่ (Asian Emerging Markets)",
    },
    "PVDMPINC": {
        "policyName": "ตราสารหนี้ต่างประเทศ",
        "aimcType": "Foreign Fixed Income",
        "aimcDescription": "กองทุนรวมตราสารหนี้ต่างประเทศ",
        "riskLevel": "RS4",
        "objective": "ลงทุนในกองทุนรวมตราสารหนี้ต่างประเทศเพื่อสร้างผลตอบแทนและกระแสรายได้สม่ำเสมอ",
    },
    "PVDMGLDH": {
        "policyName": "สินทรัพย์ทางเลือก",
        "aimcType": "Commodities Precious Metals",
        "aimcDescription": "กองทุนรวมทองคำ (ป้องกันความเสี่ยงอัตราแลกเปลี่ยน)",
        "riskLevel": "RS8",
        "objective": "ลงทุนในกองทุนรวมทองคำแท่งในต่างประเทศพร้อมป้องกันความเสี่ยงอัตราแลกเปลี่ยน (THB Hedged)",
    },
}
