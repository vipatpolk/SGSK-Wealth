package com.sgsk.wealth.e2e.core.adapter;

import com.sgsk.wealth.e2e.core.config.E2eProperties;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Resolves the active {@link TestAdapter} based on {@code -Dtest.target} or {@code e2e.target}.
 */
@Component
public class TestAdapterRegistry {
    private final Map<TestTarget, TestAdapter> adapters = new EnumMap<>(TestTarget.class);
    private final E2eProperties properties;

    public TestAdapterRegistry(List<TestAdapter> adapterList, E2eProperties properties) {
        this.properties = properties;
        for (TestAdapter adapter : adapterList) {
            adapters.put(adapter.target(), adapter);
        }
    }

    public TestTarget activeTarget() {
        String sysProp = System.getProperty("test.target");
        if (sysProp != null && !sysProp.isBlank()) {
            return TestTarget.fromString(sysProp);
        }
        return TestTarget.fromString(properties.target());
    }

    public TestAdapter activeAdapter() {
        return adapterFor(activeTarget());
    }

    public TestAdapter adapterFor(TestTarget target) {
        TestAdapter adapter = adapters.get(target);
        if (adapter == null) {
            throw new IllegalStateException("No TestAdapter registered for target: " + target);
        }
        return adapter;
    }
}
