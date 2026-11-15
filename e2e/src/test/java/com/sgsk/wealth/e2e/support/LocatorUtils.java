package com.sgsk.wealth.e2e.support;

import com.microsoft.playwright.Locator;
import java.util.regex.Pattern;

/**
 * Shared Playwright locator helpers for JavaScript-compatible symbol regex matching.
 */
public final class LocatorUtils {

    private LocatorUtils() {}

    /**
     * Builds a word-boundary Pattern compatible with both Java Pattern and Playwright JS RegExp
     * (avoiding Pattern.quote's \Q...\E sequences).
     */
    public static Pattern symbolWordPattern(String symbol) {
        String normalized = symbol.replaceAll("\\.BK$", "");
        String escaped = normalized.replaceAll("([\\\\.^$|?*+()\\[\\]{}])", "\\\\$1");
        return Pattern.compile("\\b" + escaped + "\\b");
    }

    /** Filters matching locator rows by normalized symbol word boundary and returns the first match. */
    public static Locator filterBySymbolWord(Locator rows, String symbol) {
        return rows.filter(new Locator.FilterOptions().setHasText(symbolWordPattern(symbol))).first();
    }
}
