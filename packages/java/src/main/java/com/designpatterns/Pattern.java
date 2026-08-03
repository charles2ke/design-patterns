
package com.designpatterns;

public final class Pattern {
    private final int id;
    private final String slug;
    private final String name;
    private final String category;
    private final String intent;
    private final String useWhen;

    public Pattern(int id, String slug, String name, String category, String intent, String useWhen) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.category = category;
        this.intent = intent;
        this.useWhen = useWhen;
    }

    public int getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public String getIntent() {
        return intent;
    }

    public String getUseWhen() {
        return useWhen;
    }
}
