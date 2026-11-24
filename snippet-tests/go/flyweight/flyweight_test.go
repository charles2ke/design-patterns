package flyweight_test

import (
	"reflect"
	"testing"

	"github.com/charles2ke/design-patterns/snippet-tests/go/flyweight"
)

func TestGlyphFieldsCannotBeChangedByOtherPackages(t *testing.T) {
	glyphType := reflect.TypeOf(flyweight.Glyph{})
	for i := 0; i < glyphType.NumField(); i++ {
		if field := glyphType.Field(i); field.IsExported() {
			t.Errorf("Glyph.%s is exported, so one caller can change a glyph that every placement shares", field.Name)
		}
	}
}

func TestFactorySharesOneGlyphPerSymbolAndFont(t *testing.T) {
	factory := flyweight.NewGlyphFactory()
	glyph := factory.Get('A', "Inter")

	if factory.Get('A', "Inter") != glyph {
		t.Fatal(`Get('A', "Inter") created a second glyph instead of returning the shared one`)
	}
	if factory.Get('A', "Serif") == glyph {
		t.Fatal("glyphs with different fonts must not be shared")
	}
	if glyph.Symbol() != 'A' || glyph.Font() != "Inter" {
		t.Fatalf("got (%q, %q), want ('A', \"Inter\")", glyph.Symbol(), glyph.Font())
	}
}
