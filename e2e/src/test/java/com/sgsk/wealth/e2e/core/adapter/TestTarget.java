package com.sgsk.wealth.e2e.core.adapter;

import java.util.Locale;

/**
 * Execution target for cross-platform BDD scenarios.
 */
public enum TestTarget {
    API,
    WEB,
    MOBILE;

    public static TestTarget fromString(String raw) {
        if (raw == null || raw.isBlank()) {
            return API;
        }
        return switch (raw.trim().toUpperCase(Locale.ROOT)) {
            case "WEB" -> WEB;
            case "MOBILE" -> MOBILE;
            default -> API;
        };
    }
}
