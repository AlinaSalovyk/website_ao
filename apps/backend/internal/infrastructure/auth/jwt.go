// Package auth provides Google OAuth 2.0 authentication and custom
// HMAC-SHA256 JWT token generation/validation for the admin panel.
package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	TokenExpiry        = 24 * time.Hour      // Access token expiry time (1 day).
	RefreshTokenExpiry = 30 * 24 * time.Hour // Refresh token expiry time (30 days).
	jwtAlg             = "HS256"             // JWT algorithm.
)

// Claims represents the JWT payload for both access and refresh tokens.
type Claims struct {
	Email     string `json:"email"`             // Admin's Google email.
	Name      string `json:"name,omitempty"`    // Display name from Google profile.
	Picture   string `json:"picture,omitempty"` // Profile picture URL.
	TokenType string `json:"type,omitempty"`    // "access" or "refresh".
	JTI       string `json:"jti,omitempty"`     // Unique token ID for granular revocation.
	IssuedAt  int64  `json:"iat"`               // Unix timestamp of token creation.
	ExpiresAt int64  `json:"exp"`               // Unix timestamp of token expiry.
}

// IsExpired returns true if the token's expiry timestamp is in the past.
func (c *Claims) IsExpired() bool {
	return time.Now().Unix() > c.ExpiresAt
}

// JWTService handles JWT token creation and validation using HMAC-SHA256.
type JWTService struct {
	secret []byte
}

// NewJWTService creates a JWTService with the given HMAC secret.
// The secret must be at least 32 bytes for production use.
func NewJWTService(secret string) *JWTService {
	return &JWTService{secret: []byte(secret)}
}

// GenerateToken creates a signed access JWT (24h expiry) for the given user.
func (s *JWTService) GenerateToken(user *GoogleUserInfo) (string, error) {
	now := time.Now()
	claims := Claims{
		Email:     user.Email,
		Name:      user.Name,
		Picture:   user.Picture,
		TokenType: "access",
		JTI:       uuid.NewString(),
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(TokenExpiry).Unix(),
	}
	return s.signClaims(claims)
}

// GenerateRefreshToken creates a signed refresh JWT (30-day expiry) for the given user.
func (s *JWTService) GenerateRefreshToken(user *GoogleUserInfo) (string, error) {
	now := time.Now()
	claims := Claims{
		Email:     user.Email,
		TokenType: "refresh",
		JTI:       uuid.NewString(),
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(RefreshTokenExpiry).Unix(),
	}
	return s.signClaims(claims)
}

// signClaims encodes a Claims payload as base64url(header).base64url(payload).base64url(HMAC-SHA256).
func (s *JWTService) signClaims(claims Claims) (string, error) {
	header := map[string]string{"alg": jwtAlg, "typ": "JWT"}
	headerJSON, _ := json.Marshal(header)
	headerB64 := base64URLEncode(headerJSON)

	payloadJSON, err := json.Marshal(claims)
	if err != nil {
		return "", fmt.Errorf("jwt: marshal claims: %w", err)
	}
	payloadB64 := base64URLEncode(payloadJSON)

	signingInput := headerB64 + "." + payloadB64
	signature := s.sign([]byte(signingInput))
	signatureB64 := base64URLEncode(signature)

	return signingInput + "." + signatureB64, nil
}

// ValidateToken verifies an access token's signature, expiry, and type.
// Returns an error if the token is a refresh token.
func (s *JWTService) ValidateToken(tokenStr string) (*Claims, error) {
	claims, err := s.parseClaims(tokenStr)
	if err != nil {
		return nil, err
	}
	if claims.TokenType == "refresh" {
		return nil, fmt.Errorf("jwt: refresh token cannot be used as access token")
	}
	return claims, nil
}

// ValidateRefreshToken verifies a refresh token's signature, expiry, and type.
// Returns an error if the token is not a refresh token.
func (s *JWTService) ValidateRefreshToken(tokenStr string) (*Claims, error) {
	claims, err := s.parseClaims(tokenStr)
	if err != nil {
		return nil, err
	}
	if claims.TokenType != "refresh" {
		return nil, fmt.Errorf("jwt: not a refresh token")
	}
	return claims, nil
}

// parseClaims validates signature, decodes payload, checks expiry and email presence.
func (s *JWTService) parseClaims(tokenStr string) (*Claims, error) {
	parts := strings.SplitN(tokenStr, ".", 3)
	if len(parts) != 3 {
		return nil, fmt.Errorf("jwt: invalid token format")
	}

	signingInput := parts[0] + "." + parts[1]
	expectedSig := s.sign([]byte(signingInput))
	actualSig, err := base64URLDecode(parts[2])
	if err != nil {
		return nil, fmt.Errorf("jwt: invalid signature encoding: %w", err)
	}

	if !hmac.Equal(expectedSig, actualSig) {
		return nil, fmt.Errorf("jwt: invalid signature")
	}

	payloadJSON, err := base64URLDecode(parts[1])
	if err != nil {
		return nil, fmt.Errorf("jwt: invalid payload encoding: %w", err)
	}

	var claims Claims
	if err := json.Unmarshal(payloadJSON, &claims); err != nil {
		return nil, fmt.Errorf("jwt: invalid payload: %w", err)
	}

	if claims.IsExpired() {
		return nil, fmt.Errorf("jwt: token expired")
	}

	if claims.Email == "" {
		return nil, fmt.Errorf("jwt: missing email in claims")
	}

	return &claims, nil
}

// sign computes an HMAC-SHA256 MAC of data using the service's secret.
func (s *JWTService) sign(data []byte) []byte {
	mac := hmac.New(sha256.New, s.secret)
	mac.Write(data)
	return mac.Sum(nil)
}

// base64URLEncode encodes bytes to unpadded base64url format.
func base64URLEncode(data []byte) string {
	return base64.RawURLEncoding.EncodeToString(data)
}

// base64URLDecode decodes an unpadded base64url string.
func base64URLDecode(s string) ([]byte, error) {
	return base64.RawURLEncoding.DecodeString(s)
}
