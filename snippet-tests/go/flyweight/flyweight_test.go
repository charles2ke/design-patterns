package flyweight_test

import (
	"go/token"
	"reflect"
	"testing"

	"github.com/charles2ke/design-patterns/snippet-tests/go/flyweight"
)

func TestCallersCannotReplaceASharedGlyph(t *testing.T) {
	// From a struct pointer, any caller could write *glyph = ... and change every placement.
	if result := reflect.TypeOf((*flyweight.GlyphFactory).Get).Out(0); result.Kind() != reflect.Interface {
		t.Fatalf("Get returns %v; want a read-only interface", result)
	}
	// An exported concrete type could be type-asserted back to a pointer and overwritten.
	concrete := reflect.TypeOf(flyweight.NewGlyphFactory().Get('A', "Inter"))
	if concrete.Kind() == reflect.Pointer {
		concrete = concrete.Elem()
	}
	if token.IsExported(concrete.Name()) {
		t.Fatalf("Get returns a %v, which other packages can type-assert to and overwrite", concrete)
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
