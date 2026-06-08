package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	googleAuthURL     = "https://accounts.google.com/o/oauth2/v2/auth"
	googleTokenURL    = "https://oauth2.googleapis.com/token"
	googleUserInfoURL = "https://www.googleapis.com/oauth2/v3/userinfo"
)

// OAuthConfig holds the Google OAuth 2.0 client credentials.
type OAuthConfig struct {
	ClientID     string // Google Cloud Console client ID.
	ClientSecret string // Google Cloud Console client secret.
	RedirectURL  string // OAuth callback URL (must match Cloud Console config).
}

// GoogleUserInfo represents the user profile returned by Google's userinfo endpoint.
type GoogleUserInfo struct {
	Sub           string `json:"sub"`            // Google's unique user ID.
	Email         string `json:"email"`          // User's email address.
	EmailVerified bool   `json:"email_verified"` // Whether Google has verified the email.
	Name          string `json:"name"`           // Display name.
	Picture       string `json:"picture"`        // Profile picture URL.
}

// tokenResponse is the JSON body returned by Google's token exchange endpoint.
type tokenResponse struct {
	AccessToken  string `json:"access_token"`            // Google access token.
	ExpiresIn    int    `json:"expires_in"`              // Token lifetime in seconds.
	TokenType    string `json:"token_type"`              // Token type (e.g., Bearer).
	Scope        string `json:"scope"`                   // Token scope.
	IDToken      string `json:"id_token,omitempty"`      // ID token.
	RefreshToken string `json:"refresh_token,omitempty"` // Refresh token.
}

// OAuthService handles the Google OAuth 2.0 authorization code flow.
type OAuthService struct {
	config     OAuthConfig
	httpClient *http.Client
}

// NewOAuthService creates an OAuthService with a 10-second HTTP timeout.
func NewOAuthService(cfg OAuthConfig) *OAuthService {
	return &OAuthService{
		config: cfg,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetAuthURL builds the Google OAuth consent screen URL with the given CSRF state.
func (s *OAuthService) GetAuthURL(state string) string {
	params := url.Values{
		"client_id":     {s.config.ClientID},      // Google client ID.
		"redirect_uri":  {s.config.RedirectURL},   // Callback URL.
		"response_type": {"code"},                 // Authorization code flow.
		"scope":         {"openid email profile"}, // OpenID Connect scope.
		"access_type":   {"offline"},              // Offline access.
		"state":         {state},                  // CSRF state.
		"prompt":        {"consent"},              // Force consent screen every time.
	}
	return googleAuthURL + "?" + params.Encode()
}

// ExchangeCode exchanges an authorization code for a Google access token.
func (s *OAuthService) ExchangeCode(ctx context.Context, code string) (string, error) {
	data := url.Values{
		"code":          {code},                  // Authorization code.
		"client_id":     {s.config.ClientID},     // Google client ID.
		"client_secret": {s.config.ClientSecret}, // Google client secret.
		"redirect_uri":  {s.config.RedirectURL},  // Callback URL.
		"grant_type":    {"authorization_code"},  // Authorization code flow.
	}

	req, err := http.NewRequestWithContext(ctx, "POST", googleTokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return "", fmt.Errorf("oauth: create token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("oauth: token exchange: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("oauth: token exchange failed (status %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp tokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", fmt.Errorf("oauth: parse token response: %w", err)
	}

	if tokenResp.AccessToken == "" {
		return "", fmt.Errorf("oauth: empty access token in response")
	}

	return tokenResp.AccessToken, nil
}

// GetUserInfo fetches the authenticated user's profile from Google.
// Returns an error if the email is missing or unverified.
func (s *OAuthService) GetUserInfo(ctx context.Context, accessToken string) (*GoogleUserInfo, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", googleUserInfoURL, nil)
	if err != nil {
		return nil, fmt.Errorf("oauth: create userinfo request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("oauth: get userinfo: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("oauth: userinfo failed (status %d): %s", resp.StatusCode, string(body))
	}

	var info GoogleUserInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, fmt.Errorf("oauth: parse userinfo: %w", err)
	}

	if info.Email == "" {
		return nil, fmt.Errorf("oauth: no email in userinfo response")
	}

	if !info.EmailVerified {
		return nil, fmt.Errorf("oauth: email %q is not verified by Google", info.Email)
	}

	return &info, nil
}
