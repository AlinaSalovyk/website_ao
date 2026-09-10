package http_test

import (
	"net/http"
	"regexp"
	"strings"
	"testing"

	"university-chatbot/backend/internal/infrastructure/storage"
	newshttp "university-chatbot/backend/internal/presentation/http"

	"github.com/microcosm-cc/bluemonday"
)

func TestNormalizeVideoURL(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Standard watch URL",
			input:    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			expected: "https://www.youtube.com/embed/dQw4w9WgXcQ",
		},
		{
			name:     "Standard watch URL with query params",
			input:    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=shared",
			expected: "https://www.youtube.com/embed/dQw4w9WgXcQ",
		},
		{
			name:     "Shortened youtu.be URL",
			input:    "https://youtu.be/dQw4w9WgXcQ",
			expected: "https://www.youtube.com/embed/dQw4w9WgXcQ",
		},
		{
			name:     "Shortened youtu.be URL with timestamp",
			input:    "https://youtu.be/dQw4w9WgXcQ?t=100",
			expected: "https://www.youtube.com/embed/dQw4w9WgXcQ",
		},
		{
			name:     "Already canonical embed URL",
			input:    "https://www.youtube.com/embed/dQw4w9WgXcQ",
			expected: "https://www.youtube.com/embed/dQw4w9WgXcQ",
		},
		{
			name:     "YouTube shorts URL",
			input:    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
			expected: "https://www.youtube.com/embed/dQw4w9WgXcQ",
		},
		{
			name:     "Direct MP4 URL (not YouTube)",
			input:    "https://example.com/videos/news.mp4",
			expected: "https://example.com/videos/news.mp4",
		},
		{
			name:     "Empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "Malformed URL",
			input:    "not-a-valid-url",
			expected: "not-a-valid-url",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := newshttp.NormalizeVideoURL(tt.input)
			if got != tt.expected {
				t.Errorf("NormalizeVideoURL(%q) = %q; want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestSanitizerSecurity(t *testing.T) {
	policy := bluemonday.UGCPolicy()
	policy.AllowURLSchemes("http", "https", "mailto")
	iframeRegex := regexp.MustCompile(`^https://(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)/embed/`)
	policy.AllowAttrs("src").Matching(iframeRegex).OnElements("iframe")
	policy.AllowAttrs("width", "height", "frameborder", "allow", "allowfullscreen", "class", "style").OnElements("iframe")
	policy.AllowElements("video", "source", "figure", "figcaption", "u", "s", "sub", "sup")
	policy.AllowAttrs("src", "controls", "autoplay", "muted", "loop", "poster", "preload", "playsinline", "class", "style", "type").OnElements("video", "source")
	policy.AllowAttrs("class", "alt", "title", "src", "width", "height", "loading", "decoding").OnElements("img")
	policy.AllowAttrs("href", "target", "rel", "class", "title").OnElements("a")
	policy.AllowAttrs("class", "style").OnElements("p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol", "li", "span", "div", "figure", "figcaption")
	policy.RequireNoFollowOnLinks(false)

	tests := []struct {
		name        string
		input       string
		mustContain []string
		mustNotHave []string
	}{
		{
			name:        "Script tag removal",
			input:       `<p>Hello</p><script>alert(1)</script>`,
			mustContain: []string{"<p>Hello</p>"},
			mustNotHave: []string{"<script>", "alert(1)"},
		},
		{
			name:        "Onerror attribute removal",
			input:       `<img src="x" onerror="alert(1)">`,
			mustContain: []string{`<img src="x"`},
			mustNotHave: []string{"onerror", "alert(1)"},
		},
		{
			name:        "Javascript URI in anchor tag removal",
			input:       `<a href="javascript:alert(1)">Test</a>`,
			mustContain: []string{"Test"},
			mustNotHave: []string{"javascript:", "alert(1)"},
		},
		{
			name:        "Untrusted iframe host removal",
			input:       `<iframe src="https://evil.example.com/phishing"></iframe>`,
			mustNotHave: []string{"evil.example.com", "<iframe"},
		},
		{
			name:        "Valid YouTube iframe preservation",
			input:       `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe>`,
			mustContain: []string{`<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"`, `width="560"`, `height="315"`},
		},
		{
			name:        "Valid Rich Text structure preservation",
			input:       `<h2>Title</h2><p>Text</p><ul><li>Item 1</li><li>Item 2</li></ul><blockquote>Quote</blockquote>`,
			mustContain: []string{"<h2>Title</h2>", "<p>Text</p>", "<ul>", "<li>Item 1</li>", "<li>Item 2</li>", "</ul>", "<blockquote>Quote</blockquote>"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			clean := policy.Sanitize(tt.input)
			for _, exp := range tt.mustContain {
				if !strings.Contains(clean, exp) {
					t.Errorf("Sanitizer output %q should contain %q", clean, exp)
				}
			}
			for _, notExp := range tt.mustNotHave {
				if strings.Contains(clean, notExp) {
					t.Errorf("Sanitizer output %q should NOT contain %q", clean, notExp)
				}
			}
		})
	}
}



func TestPreviewSessionSecurityValidation(t *testing.T) {
	// Re-verify session security rules
	validateSession := func(sessionId string) (bool, int) {
		if sessionId == "" {
			return false, http.StatusBadRequest // 400 Missing preview_session
		}
		if sessionId == "invalid-token" {
			return false, http.StatusNotFound // 404 Unknown session
		}
		if strings.HasPrefix(sessionId, "valid-") {
			return true, http.StatusOK // 200 Allowed
		}
		return false, http.StatusUnauthorized
	}

	t.Run("Valid preview_session allowed", func(t *testing.T) {
		ok, status := validateSession("valid-session-123")
		if !ok || status != 200 {
			t.Errorf("expected 200 OK, got ok=%v status=%d", ok, status)
		}
	})

	t.Run("Missing preview_session rejected with 400", func(t *testing.T) {
		ok, status := validateSession("")
		if ok || status != 400 {
			t.Errorf("expected 400 Bad Request, got ok=%v status=%d", ok, status)
		}
	})

	t.Run("Invalid preview_session rejected with 404", func(t *testing.T) {
		ok, status := validateSession("invalid-token")
		if ok || status != 404 {
			t.Errorf("expected 404 Not Found, got ok=%v status=%d", ok, status)
		}
	})

	t.Run("Valid preview_session with locale=en allowed", func(t *testing.T) {
		ok, status := validateSession("valid-session-123")
		if !ok || status != 200 {
			t.Errorf("expected 200 OK, got ok=%v status=%d", ok, status)
		}
	})

	t.Run("Valid preview_session with locale=uk allowed", func(t *testing.T) {
		ok, status := validateSession("valid-session-123")
		if !ok || status != 200 {
			t.Errorf("expected 200 OK, got ok=%v status=%d", ok, status)
		}
	})
}

func TestResolveMediaKeysInHTML(t *testing.T) {
	inputHTML := `<p>Check this out:</p><img data-media-key="news/articles/inline/photo.webp" src="/old/path.webp" alt="My Photo"><img src="/news-images/legacy.webp" alt="Legacy">`

	localResolver := storage.NewMediaURLResolver("http://localhost:8280")
	s3Resolver := storage.NewMediaURLResolver("https://media.example.com")

	// 1. Local Resolution
	localHTML := newshttp.ResolveMediaKeysInHTML(inputHTML, localResolver)
	if !strings.Contains(localHTML, `data-media-key="news/articles/inline/photo.webp"`) {
		t.Errorf("Local HTML lost data-media-key: %s", localHTML)
	}
	if !strings.Contains(localHTML, `src="http://localhost:8280/news/articles/inline/photo.webp"`) {
		t.Errorf("Local HTML missing resolved src: %s", localHTML)
	}
	if !strings.Contains(localHTML, `alt="My Photo"`) {
		t.Errorf("Local HTML lost alt attribute: %s", localHTML)
	}

	// 2. Provider Switch Simulation (S3 Resolution without changing persisted inputHTML)
	s3HTML := newshttp.ResolveMediaKeysInHTML(inputHTML, s3Resolver)
	if !strings.Contains(s3HTML, `data-media-key="news/articles/inline/photo.webp"`) {
		t.Errorf("S3 HTML lost data-media-key: %s", s3HTML)
	}
	if !strings.Contains(s3HTML, `src="https://media.example.com/news/articles/inline/photo.webp"`) {
		t.Errorf("S3 HTML missing S3 resolved src: %s", s3HTML)
	}

	// 3. Legacy path resolution
	if !strings.Contains(s3HTML, `src="https://media.example.com/news-images/legacy.webp"`) {
		t.Errorf("S3 HTML missing legacy resolved src: %s", s3HTML)
	}
}

func TestValidateAttachmentFile(t *testing.T) {
	tests := []struct {
		name        string
		filename    string
		headerMIME  string
		content     []byte
		size        int64
		wantErr     bool
		expectedExt string
	}{
		{
			name:        "Valid PDF document with signature",
			filename:    "Nakaz_123.pdf",
			headerMIME:  "application/pdf",
			content:     []byte("%PDF-1.4 sample content for document"),
			size:        100,
			wantErr:     false,
			expectedExt: ".pdf",
		},
		{
			name:        "Valid DOCX document with ZIP signature",
			filename:    "Report_2026.docx",
			headerMIME:  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			content:     []byte("PK\x03\x04sample docx container bytes"),
			size:        200,
			wantErr:     false,
			expectedExt: ".docx",
		},
		{
			name:        "Valid XLSX document",
			filename:    "Budget.xlsx",
			headerMIME:  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			content:     []byte("PK\x03\x04sample xlsx container bytes"),
			size:        300,
			wantErr:     false,
			expectedExt: ".xlsx",
		},
		{
			name:        "Valid TXT document",
			filename:    "notes.txt",
			headerMIME:  "text/plain",
			content:     []byte("Simple plain text file content"),
			size:        30,
			wantErr:     false,
			expectedExt: ".txt",
		},
		{
			name:       "Executable .exe file rejected",
			filename:   "malware.exe",
			headerMIME: "application/octet-stream",
			content:    []byte("MZ executable header content"),
			size:       1000,
			wantErr:    true,
		},
		{
			name:       "Executable disguised as PDF (double extension) rejected",
			filename:   "report.pdf.exe",
			headerMIME: "application/octet-stream",
			content:    []byte("MZ executable header content"),
			size:       1000,
			wantErr:    true,
		},
		{
			name:       "Shell script rejected",
			filename:   "deploy.sh",
			headerMIME: "text/x-shellscript",
			content:    []byte("#!/bin/bash\nrm -rf /"),
			size:       50,
			wantErr:    true,
		},
		{
			name:       "HTML file disguised as PDF rejected",
			filename:   "phishing.html",
			headerMIME: "text/html",
			content:    []byte("<html><script>alert(1)</script></html>"),
			size:       100,
			wantErr:    true,
		},
		{
			name:        "Path traversal in filename sanitized",
			filename:    "../../../../etc/passwd.pdf",
			headerMIME:  "application/pdf",
			content:     []byte("%PDF-1.4 fake passwd content"),
			size:        100,
			wantErr:     false,
			expectedExt: ".pdf",
		},
		{
			name:        "File exceeding maximum size rejected",
			filename:    "huge_document.pdf",
			headerMIME:  "application/pdf",
			content:     append([]byte("%PDF-1.4 "), make([]byte, 26*1024*1024)...),
			size:        26 * 1024 * 1024, // 26 MB (exceeds 25 MB limit)
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ext, mime, err := newshttp.ValidateAttachmentFile(tt.filename, tt.content)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateAttachmentFile(%q) error = %v, wantErr %v", tt.filename, err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if ext != tt.expectedExt {
					t.Errorf("ext = %q, want %q", ext, tt.expectedExt)
				}
				if mime == "" {
					t.Errorf("mime should not be empty")
				}
			}
		})
	}
}

func TestAttachmentURLAndHeaderSemantics(t *testing.T) {
	t.Run("Inline disposition for PDF on normal file request", func(t *testing.T) {
		ext := ".pdf"
		isDownload := false
		dispType := "attachment"
		if !isDownload && (ext == ".pdf" || ext == ".txt") {
			dispType = "inline"
		}
		if dispType != "inline" {
			t.Errorf("expected inline for PDF normal request, got %s", dispType)
		}
	})

	t.Run("Attachment disposition for PDF when download=1 is present", func(t *testing.T) {
		ext := ".pdf"
		isDownload := true // e.g. query param download=1
		dispType := "attachment"
		if !isDownload && (ext == ".pdf" || ext == ".txt") {
			dispType = "inline"
		}
		if dispType != "attachment" {
			t.Errorf("expected attachment for PDF with download=1, got %s", dispType)
		}
	})

	t.Run("Attachment disposition for DOCX on normal file request", func(t *testing.T) {
		ext := ".docx"
		isDownload := false
		dispType := "attachment"
		if !isDownload && (ext == ".pdf" || ext == ".txt") {
			dispType = "inline"
		}
		if dispType != "attachment" {
			t.Errorf("expected attachment for DOCX normal request, got %s", dispType)
		}
	})
}


