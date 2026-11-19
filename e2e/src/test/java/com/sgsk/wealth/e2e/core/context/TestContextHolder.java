package com.sgsk.wealth.e2e.core.context;

public final class TestContextHolder {
    private static final ThreadLocal<TestContext> CURRENT = new ThreadLocal<>();

    private TestContextHolder() {
    }

    public static void set(TestContext context) {
        if (context == null) {
            CURRENT.remove();
        } else {
            CURRENT.set(context);
        }
    }

    public static TestContext get() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }
}
