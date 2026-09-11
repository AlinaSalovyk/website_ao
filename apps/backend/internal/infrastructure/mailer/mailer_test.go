package mailer

import (
	"context"
	"strings"
	"testing"
	"time"

	"university-chatbot/backend/internal/domain"
)

func TestConfig_Validate(t *testing.T) {
	validConfig := Config{
		Host:      "smtp.example.com",
		Port:      587,
		Username:  "user@example.com",
		Password:  "secret-password",
		FromEmail: "no-reply@example.com",
		FromName:  "Test System",
		Security:  SMTPSecurityStartTLS,
		AuthMode:  SMTPAuthModePlain,
		Timeout:   10 * time.Second,
	}

	if err := validConfig.Validate(); err != nil {
		t.Errorf("expected valid config to pass, got: %v", err)
	}

	tests := []struct {
		name      string
		modify    func(c *Config)
		wantError string
	}{
		{
			name: "missing host",
			modify: func(c *Config) {
				c.Host = ""
			},
			wantError: "SMTP_HOST is required",
		},
		{
			name: "invalid port",
			modify: func(c *Config) {
				c.Port = 0
			},
			wantError: "SMTP_PORT must be between 1 and 65535",
		},
		{
			name: "missing from email",
			modify: func(c *Config) {
				c.FromEmail = ""
			},
			wantError: "SMTP_FROM_EMAIL is required",
		},
		{
			name: "invalid from email format",
			modify: func(c *Config) {
				c.FromEmail = "not-an-email"
			},
			wantError: "SMTP_FROM_EMAIL is invalid",
		},
		{
			name: "from email newline injection",
			modify: func(c *Config) {
				c.FromEmail = "admin@example.com\r\nBcc: hacker@evil.com"
			},
			wantError: "SMTP_FROM_EMAIL must not contain newline characters",
		},
		{
			name: "invalid security mode",
			modify: func(c *Config) {
				c.Security = "invalid_mode"
			},
			wantError: "SMTP_SECURITY is required",
		},
		{
			name: "invalid auth mode",
			modify: func(c *Config) {
				c.AuthMode = "invalid_auth"
			},
			wantError: "SMTP_AUTH_MODE is required",
		},
		{
			name: "plain auth missing username",
			modify: func(c *Config) {
				c.AuthMode = SMTPAuthModePlain
				c.Username = ""
			},
			wantError: "SMTP_USERNAME and SMTP_PASSWORD are required when SMTP_AUTH_MODE=plain",
		},
		{
			name: "plain auth missing password",
			modify: func(c *Config) {
				c.AuthMode = SMTPAuthModePlain
				c.Password = ""
			},
			wantError: "SMTP_USERNAME and SMTP_PASSWORD are required when SMTP_AUTH_MODE=plain",
		},
		{
			name: "none auth mode without credentials is valid",
			modify: func(c *Config) {
				c.AuthMode = SMTPAuthModeNone
				c.Username = ""
				c.Password = ""
			},
			wantError: "",
		},
		{
			name: "missing timeout",
			modify: func(c *Config) {
				c.Timeout = 0
			},
			wantError: "SMTP_TIMEOUT is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := validConfig
			tt.modify(&cfg)
			err := cfg.Validate()
			if tt.wantError == "" {
				if err != nil {
					t.Errorf("expected no error, got: %v", err)
				}
			} else {
				if err == nil {
					t.Errorf("expected error containing %q, got nil", tt.wantError)
				} else if !strings.Contains(err.Error(), tt.wantError) {
					t.Errorf("expected error containing %q, got %q", tt.wantError, err.Error())
				}
			}
		})
	}
}

func TestMailerService_NoHostnameBranching(t *testing.T) {
	// Verify that MailerService treats any arbitrary host using the exact same code path.
	arbitraryConfig := Config{
		Host:      "some-random-smtp-host.internal",
		Port:      1025,
		FromEmail: "system@internal.test",
		FromName:  "Internal System",
		Security:  SMTPSecurityNone,
		AuthMode:  SMTPAuthModeNone,
		Timeout:   100 * time.Millisecond,
	}

	svc, err := NewMailerService(arbitraryConfig)
	if err != nil {
		t.Fatalf("failed to create mailer service: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()

	// Sending to a non-existent host must attempt standard TCP dial and fail cleanly without panic or special casing
	err = svc.SendInvitation(ctx, "user@example.com", domain.RoleNewsEditor, "http://example.com/accept", time.Now().Add(48*time.Hour))
	if err == nil {
		t.Errorf("expected connection error for fake host, got nil")
	} else if !strings.Contains(err.Error(), "smtp connection error") {
		t.Errorf("expected connection error, got %v", err)
	}
}
