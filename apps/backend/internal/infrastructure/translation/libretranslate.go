package translation

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"
)

var (
	ErrServiceUnavailable  = errors.New("service_unavailable")
	ErrLanguageUnavailable = errors.New("language_unavailable")
	ErrTranslationFailed   = errors.New("translation_failed")
)

// TranslationProvider defines the interface for language translation services.
type TranslationProvider interface {
	TranslateBatch(ctx context.Context, texts []string, sourceLang, targetLang, format string) ([]string, error)
	TranslateHTMLBatch(ctx context.Context, texts []string, sourceLang, targetLang string) ([]string, error)
}

// LibreTranslateProvider implements TranslationProvider using self-hosted LibreTranslate.
type LibreTranslateProvider struct {
	apiURL     string
	httpClient *http.Client
}

type libreTranslateRequest struct {
	Q      []string `json:"q"`
	Source string   `json:"source"`
	Target string   `json:"target"`
	Format string   `json:"format"`
}

type libreTranslateResponse struct {
	TranslatedText interface{} `json:"translatedText"`
	Error          string      `json:"error,omitempty"`
}

// NewLibreTranslateProvider creates a new self-hosted LibreTranslate provider.
func NewLibreTranslateProvider(apiURL string) *LibreTranslateProvider {
	apiURL = strings.TrimSuffix(strings.TrimSpace(apiURL), "/")
	if apiURL == "" {
		return nil
	}
	return &LibreTranslateProvider{
		apiURL: apiURL,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// TranslateHTMLBatch translates a batch of HTML formatted strings.
func (p *LibreTranslateProvider) TranslateHTMLBatch(ctx context.Context, texts []string, sourceLang, targetLang string) ([]string, error) {
	return p.TranslateBatch(ctx, texts, sourceLang, targetLang, "html")
}

// TranslateBatch translates an array of strings in either "text" or "html" format.
func (p *LibreTranslateProvider) TranslateBatch(ctx context.Context, texts []string, sourceLang, targetLang, format string) ([]string, error) {
	if p.apiURL == "" {
		return nil, ErrServiceUnavailable
	}

	if len(texts) == 0 {
		return []string{}, nil
	}

	src := strings.ToLower(sourceLang)
	tgt := strings.ToLower(targetLang)
	if strings.HasPrefix(tgt, "en") {
		tgt = "en"
	}

	reqFormat := "text"
	if strings.EqualFold(format, "html") {
		reqFormat = "html"
	}

	// Filter out empty/whitespace-only strings to prevent LibreTranslate 400/422 errors
	type nonItem struct {
		index int
		text  string
	}
	var nonEmpties []nonItem
	for i, t := range texts {
		if strings.TrimSpace(t) != "" {
			nonEmpties = append(nonEmpties, nonItem{index: i, text: t})
		}
	}

	result := make([]string, len(texts))
	if len(nonEmpties) == 0 {
		return result, nil
	}

	qArray := make([]string, len(nonEmpties))
	for i, item := range nonEmpties {
		qArray[i] = item.text
	}

	reqPayload := libreTranslateRequest{
		Q:      qArray,
		Source: src,
		Target: tgt,
		Format: reqFormat,
	}

	bodyBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return nil, fmt.Errorf("%w: marshal request: %v", ErrTranslationFailed, err)
	}

	url := p.apiURL + "/translate"
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("%w: create request: %v", ErrTranslationFailed, err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrServiceUnavailable, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp libreTranslateResponse
		_ = json.NewDecoder(resp.Body).Decode(&errResp)
		if resp.StatusCode == http.StatusServiceUnavailable {
			return nil, fmt.Errorf("%w: %s", ErrServiceUnavailable, errResp.Error)
		}
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == 422 {
			if strings.Contains(strings.ToLower(errResp.Error), "not supported") || strings.Contains(strings.ToLower(errResp.Error), "language") {
				return nil, fmt.Errorf("%w: %s", ErrLanguageUnavailable, errResp.Error)
			}
		}
		return nil, fmt.Errorf("%w: status %d: %s", ErrTranslationFailed, resp.StatusCode, errResp.Error)
	}

	var res libreTranslateResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, fmt.Errorf("%w: decode response: %v", ErrTranslationFailed, err)
	}

	if res.Error != "" {
		return nil, fmt.Errorf("%w: %s", ErrTranslationFailed, res.Error)
	}

	var translatedItems []string
	switch val := res.TranslatedText.(type) {
	case []interface{}:
		translatedItems = make([]string, len(val))
		for i, item := range val {
			str, ok := item.(string)
			if !ok {
				return nil, fmt.Errorf("%w: non-string translated item at index %d", ErrTranslationFailed, i)
			}
			translatedItems[i] = str
		}
	case string:
		if len(nonEmpties) == 1 {
			translatedItems = []string{val}
		} else {
			return nil, fmt.Errorf("%w: single string returned for batch size %d", ErrTranslationFailed, len(nonEmpties))
		}
	default:
		return nil, fmt.Errorf("%w: missing or invalid translatedText format", ErrTranslationFailed)
	}

	if len(translatedItems) != len(nonEmpties) {
		return nil, fmt.Errorf("%w: expected %d translations, got %d", ErrTranslationFailed, len(nonEmpties), len(translatedItems))
	}

	for i, item := range nonEmpties {
		tr := translatedItems[i]
		if reqFormat == "html" {
			tr = RestoreProtectedAttributes(item.text, tr)
		}
		result[item.index] = tr
	}

	return result, nil
}

// RestoreProtectedAttributes ensures href, src, and video embed URLs are accurately preserved from original HTML.
func RestoreProtectedAttributes(original, translated string) string {
	if !strings.Contains(original, "<") {
		return translated
	}

	hrefRegex := regexp.MustCompile(`href=["']([^"']+)["']`)
	origHrefs := hrefRegex.FindAllStringSubmatch(original, -1)

	srcRegex := regexp.MustCompile(`src=["']([^"']+)["']`)
	origSrcs := srcRegex.FindAllStringSubmatch(original, -1)

	result := translated

	if len(origHrefs) > 0 {
		transHrefs := hrefRegex.FindAllStringSubmatch(result, -1)
		for i, match := range transHrefs {
			if i < len(origHrefs) {
				origVal := origHrefs[i][1]
				transVal := match[1]
				if transVal != origVal {
					result = strings.Replace(result, fmt.Sprintf(`href="%s"`, transVal), fmt.Sprintf(`href="%s"`, origVal), 1)
					result = strings.Replace(result, fmt.Sprintf(`href='%s'`, transVal), fmt.Sprintf(`href='%s'`, origVal), 1)
				}
			}
		}
	}

	if len(origSrcs) > 0 {
		transSrcs := srcRegex.FindAllStringSubmatch(result, -1)
		for i, match := range transSrcs {
			if i < len(origSrcs) {
				origVal := origSrcs[i][1]
				transVal := match[1]
				if transVal != origVal {
					result = strings.Replace(result, fmt.Sprintf(`src="%s"`, transVal), fmt.Sprintf(`src="%s"`, origVal), 1)
					result = strings.Replace(result, fmt.Sprintf(`src='%s'`, transVal), fmt.Sprintf(`src='%s'`, origVal), 1)
				}
			}
		}
	}

	return result
}
