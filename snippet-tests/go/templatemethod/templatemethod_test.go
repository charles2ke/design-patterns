package templatemethod_test

import (
	"reflect"
	"testing"

	"github.com/charles2ke/design-patterns/snippet-tests/go/templatemethod"
)

func TestCSVTreatsCRLFLikeLF(t *testing.T) {
	const lf = "ada,42\nbob,\ncy,7"
	const crlf = "ada,42\r\nbob,\r\ncy,7"
	csv := templatemethod.CSV{}

	if got, want := csv.Parse(crlf), csv.Parse(lf); !reflect.DeepEqual(got, want) {
		t.Fatalf("Parse(CRLF) = %q, want %q", got, want)
	}
	if saved := templatemethod.Import(csv, crlf); saved != 2 {
		t.Fatalf("Import saved %d rows, want 2: the row with an empty trailing cell must be rejected", saved)
	}
}
