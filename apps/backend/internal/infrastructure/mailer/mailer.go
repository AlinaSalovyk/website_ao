package mailer

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
	"time"

	"university-chatbot/backend/internal/domain"
)

// SMTPSecurity defines the transport encryption mode.
type SMTPSecurity string

const (
	SMTPSecurityNone     SMTPSecurity = "none"
	SMTPSecurityStartTLS SMTPSecurity = "starttls"
	SMTPSecurityTLS      SMTPSecurity = "tls"
)

// SMTPAuthMode defines the SMTP authentication mode.
type SMTPAuthMode string

const (
	SMTPAuthModeNone  SMTPAuthMode = "none"
	SMTPAuthModePlain SMTPAuthMode = "plain"
)

// Config aggregates all SMTP configuration parameters.
type Config struct {
	Host      string
	Port      int
	Username  string
	Password  string
	FromEmail string
	FromName  string
	Security  SMTPSecurity
	AuthMode  SMTPAuthMode
	Timeout   time.Duration
}

// Validate checks that all required SMTP configuration parameters are valid.
// Fails fast at application startup if configuration is missing or invalid.
func (c Config) Validate() error {
	if strings.TrimSpace(c.Host) == "" {
		return errors.New("SMTP_HOST is required")
	}
	if c.Port <= 0 || c.Port > 65535 {
		return fmt.Errorf("SMTP_PORT must be between 1 and 65535, got %d", c.Port)
	}

	fromEmail := strings.TrimSpace(c.FromEmail)
	if fromEmail == "" {
		return errors.New("SMTP_FROM_EMAIL is required")
	}
	if strings.ContainsAny(fromEmail, "\r\n") {
		return errors.New("SMTP_FROM_EMAIL must not contain newline characters")
	}
	if _, err := mail.ParseAddress(fromEmail); err != nil {
		return fmt.Errorf("SMTP_FROM_EMAIL is invalid: %w", err)
	}

	if strings.ContainsAny(c.FromName, "\r\n") {
		return errors.New("SMTP_FROM_NAME must not contain newline characters")
	}

	switch c.Security {
	case SMTPSecurityNone, SMTPSecurityStartTLS, SMTPSecurityTLS:
		// valid
	default:
		return fmt.Errorf("SMTP_SECURITY is required and must be one of 'none', 'starttls', 'tls', got %q", c.Security)
	}

	switch c.AuthMode {
	case SMTPAuthModeNone, SMTPAuthModePlain:
		// valid
	default:
		return fmt.Errorf("SMTP_AUTH_MODE is required and must be one of 'none', 'plain', got %q", c.AuthMode)
	}

	if c.AuthMode == SMTPAuthModePlain {
		if strings.TrimSpace(c.Username) == "" || strings.TrimSpace(c.Password) == "" {
			return errors.New("SMTP_USERNAME and SMTP_PASSWORD are required when SMTP_AUTH_MODE=plain")
		}
	}

	if c.Timeout <= 0 {
		return errors.New("SMTP_TIMEOUT is required and must be greater than 0")
	}

	return nil
}

// MailerService implements the domain.Mailer interface over SMTP.
type MailerService struct {
	cfg Config
}

// NewMailerService constructs a MailerService with the validated Config.
func NewMailerService(cfg Config) (*MailerService, error) {
	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("invalid SMTP configuration: %w", err)
	}
	return &MailerService{cfg: cfg}, nil
}

// SendInvitation sends a branded, responsive Ukrainian HTML invitation email.
func (m *MailerService) SendInvitation(ctx context.Context, toEmail string, role domain.Role, inviteURL string, expiresAt time.Time) error {
	toEmail = strings.TrimSpace(strings.ToLower(toEmail))
	if _, err := mail.ParseAddress(toEmail); err != nil {
		return fmt.Errorf("invalid recipient email %q: %w", toEmail, err)
	}

	roleName := humanReadableRole(role)
	expiryStr := expiresAt.In(time.Local).Format("02.01.2006 15:04")
	subject := "Запрошення до адміністративної панелі"

	plainText := fmt.Sprintf(`Вітаємо!

Вас запросили до адміністративної панелі системи.

Ваша роль: %s

Щоб отримати доступ та завершити активацію акаунту, перейдіть за посиланням:
%s

Посилання дійсне до: %s

Якщо ви не очікували цього запрошення, просто проігноруйте цей лист.`, roleName, inviteURL, expiryStr)

	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Запрошення до адміністративної панелі</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="margin-bottom: 24px; text-align: center;">
      <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin: 0;">Адміністративна панель</h2>
    </div>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
      Вітаємо! Вас запрошено до адміністративної панелі університету.
    </p>
    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <div style="font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px;">Ваша роль</div>
      <div style="font-size: 16px; font-weight: 700; color: #0284c7;">%s</div>
    </div>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="%s" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">Прийняти запрошення</a>
    </div>
    <p style="font-size: 13px; color: #64748b; margin-bottom: 20px; text-align: center;">
      Посилання дійсне до: <strong>%s</strong>
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
      Якщо ви не очікували цього запрошення, просто проігноруйте цей лист.
    </p>
  </div>
</body>
</html>`, roleName, inviteURL, expiryStr)

	slog.Info("Sending invitation email via SMTP", "to", toEmail, "role", role, "smtp_host", m.cfg.Host, "smtp_port", m.cfg.Port, "security", m.cfg.Security)

	return m.sendSMTP(ctx, toEmail, subject, plainText, htmlBody)
}

func (m *MailerService) sendSMTP(ctx context.Context, toEmail, subject, plainText, htmlBody string) error {
	addr := fmt.Sprintf("%s:%d", m.cfg.Host, m.cfg.Port)
	dialTimeout := m.cfg.Timeout

	boundary := "NEXT_PART_" + fmt.Sprintf("%d", time.Now().UnixNano())

	fromHeader := m.cfg.FromEmail
	if m.cfg.FromName != "" {
		fromHeader = fmt.Sprintf("%s <%s>", m.cfg.FromName, m.cfg.FromEmail)
	}

	header := make(map[string]string)
	header["From"] = fromHeader
	header["To"] = toEmail
	header["Subject"] = subject
	header["MIME-Version"] = "1.0"
	header["Content-Type"] = "multipart/alternative; boundary=" + boundary

	var msg strings.Builder
	for k, v := range header {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")

	msg.WriteString("--" + boundary + "\r\n")
	msg.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	msg.WriteString("Content-Transfer-Encoding: 8bit\r\n\r\n")
	msg.WriteString(plainText + "\r\n\r\n")

	msg.WriteString("--" + boundary + "\r\n")
	msg.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	msg.WriteString("Content-Transfer-Encoding: 8bit\r\n\r\n")
	msg.WriteString(htmlBody + "\r\n\r\n")

	msg.WriteString("--" + boundary + "--\r\n")

	var conn net.Conn
	var err error

	if m.cfg.Security == SMTPSecurityTLS {
		tlsConfig := &tls.Config{ServerName: m.cfg.Host, InsecureSkipVerify: false}
		conn, err = tls.DialWithDialer(&net.Dialer{Timeout: dialTimeout}, "tcp", addr, tlsConfig)
	} else {
		dialer := &net.Dialer{Timeout: dialTimeout}
		conn, err = dialer.DialContext(ctx, "tcp", addr)
	}

	if err != nil {
		return fmt.Errorf("smtp connection error to %s: %w", addr, err)
	}

	client, err := smtp.NewClient(conn, m.cfg.Host)
	if err != nil {
		conn.Close()
		return fmt.Errorf("smtp client init failed: %w", err)
	}
	defer client.Close()

	if m.cfg.Security == SMTPSecurityStartTLS {
		tlsConfig := &tls.Config{ServerName: m.cfg.Host, InsecureSkipVerify: false}
		if err := client.StartTLS(tlsConfig); err != nil {
			return fmt.Errorf("smtp starttls failed: %w", err)
		}
	}

	if m.cfg.AuthMode == SMTPAuthModePlain {
		auth := smtp.PlainAuth("", m.cfg.Username, m.cfg.Password, m.cfg.Host)
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("smtp authentication failed: %w", err)
		}
	}

	if err := client.Mail(m.cfg.FromEmail); err != nil {
		return fmt.Errorf("smtp MAIL FROM failed: %w", err)
	}
	if err := client.Rcpt(toEmail); err != nil {
		return fmt.Errorf("smtp RCPT TO failed: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp DATA command failed: %w", err)
	}
	_, err = w.Write([]byte(msg.String()))
	if err != nil {
		return fmt.Errorf("smtp body write failed: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("smtp data stream close failed: %w", err)
	}

	return client.Quit()
}

func humanReadableRole(role domain.Role) string {
	switch role {
	case domain.RoleSuperAdmin:
		return "Головний адміністратор (Super Admin)"
	case domain.RoleNewsEditor:
		return "Редактор новин"
	case domain.RoleChatbotAdmin:
		return "Адміністратор чат-бота"
	default:
		return string(role)
	}
}
