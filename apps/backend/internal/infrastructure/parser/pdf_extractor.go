package parser

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/ledongthuc/pdf"
)

// PDFExtractor extracts text from PDF files using a two-stage strategy:
// 1. Attempt digital text extraction via the pdf library
// 2. Fall back to Tesseract OCR (ukr+eng) if digital text is < 100 chars
type PDFExtractor struct{}

// NewPDFExtractor creates a new PDFExtractor.
func NewPDFExtractor() *PDFExtractor {
	return &PDFExtractor{}
}
// ExtractText extracts text from a PDF at the given path.
// Returns an error if both digital extraction and OCR fail.
func (p *PDFExtractor) ExtractText(ctx context.Context, path string) (string, error) {
	digitalText, err := extractDigitalText(path)
	if err == nil && len(digitalText) > 100 {
		slog.Debug("Digital text extracted successfully", "path", path)
		return digitalText, nil
	}

	slog.Info("No digital text found, falling back to Tesseract OCR", "path", path)
	ocrText, err := extractTextOCR(ctx, path)
	if err != nil {
		return "", fmt.Errorf("помилка OCR розпізнавання: %w", err)
	}

	if len(ocrText) < 10 {
		return "", fmt.Errorf("неможливо розпізнати текст у PDF (можливо документ порожній або надто поганої якості)")
	}

	return ocrText, nil
}

// extractDigitalText extracts text from a PDF using the pdf library.
// It uses pdf.Open to open the PDF and pdf.GetPlainText to extract text.
// It returns an error if the PDF cannot be opened or if the text cannot be extracted.
func extractDigitalText(path string) (string, error) {
	f, r, err := pdf.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	b, err := r.GetPlainText()
	if err != nil {
		return "", err
	}
	
	buf := new(bytes.Buffer)
	buf.ReadFrom(b)
	return strings.TrimSpace(buf.String()), nil
}
// extractTextOCR extracts text from a PDF using Tesseract OCR.
// It converts PDF pages to JPEGs and runs Tesseract on each.
func extractTextOCR(ctx context.Context, pdfPath string) (string, error) {
	tmpDir, err := os.MkdirTemp("", "ocr-*")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(tmpDir)
	cmd := exec.CommandContext(ctx, "pdftoppm", "-jpeg", pdfPath, filepath.Join(tmpDir, "page"))
	if out, err := cmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("pdftoppm failed: %v, output: %s", err, string(out))
	}
	files, err := os.ReadDir(tmpDir)
	if err != nil {
		return "", err
	}

	var fullText strings.Builder

	for _, file := range files {
		if !strings.HasSuffix(file.Name(), ".jpg") {
			continue
		}
		imgPath := filepath.Join(tmpDir, file.Name())

		cmdTess := exec.CommandContext(ctx, "tesseract", imgPath, "stdout", "-l", "ukr+eng")
		out, err := cmdTess.Output()
		if err != nil {
			var stderr string
			if ee, ok := err.(*exec.ExitError); ok {
				stderr = string(ee.Stderr)
			}
			slog.Warn("Tesseract error on page", "file", file.Name(), "err", err, "stderr", stderr)
			continue
		}

		fullText.Write(out)
		fullText.WriteString("\n\n")
	}

	return strings.TrimSpace(fullText.String()), nil
}

// fileBasename returns the basename of a path.
func fileBasename(path string) string {
	parts := strings.Split(strings.ReplaceAll(path, "\\", "/"), "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return path
}
