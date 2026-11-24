package chain_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/charles2ke/design-patterns/snippet-tests/go/chain"
)

func TestRequireAuthForwardsOnlyCredentialsTheValidatorAccepts(t *testing.T) {
	verifySessionToken := func(authorization string) bool { return authorization == "Bearer valid-session" }

	tests := []struct {
		name          string
		authorization string
		wantStatus    int
		wantForwarded bool
	}{
		{"missing header", "", http.StatusUnauthorized, false},
		{"unverified header", "anything", http.StatusUnauthorized, false},
		{"verified session", "Bearer valid-session", http.StatusNoContent, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			forwarded := false
			next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				forwarded = true
				w.WriteHeader(http.StatusNoContent)
			})
			req := httptest.NewRequest(http.MethodPost, "/orders", nil)
			if tt.authorization != "" {
				req.Header.Set("Authorization", tt.authorization)
			}
			rec := httptest.NewRecorder()

			chain.RequireAuth(verifySessionToken)(next).ServeHTTP(rec, req)

			if rec.Code != tt.wantStatus || forwarded != tt.wantForwarded {
				t.Fatalf("got status %d, forwarded %t; want status %d, forwarded %t",
					rec.Code, forwarded, tt.wantStatus, tt.wantForwarded)
			}
		})
	}
}
