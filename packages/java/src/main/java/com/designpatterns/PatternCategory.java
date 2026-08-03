
package com.designpatterns;

public enum PatternCategory {
    CREATIONAL("Creational"),
    STRUCTURAL("Structural"),
    BEHAVIORAL("Behavioral");

    private final String value;

    PatternCategory(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}
