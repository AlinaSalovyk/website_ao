// Package parser provides multi-format document text extraction.
// Supports .txt (plain read), .docx (XML parsing), .xlsx (shared strings + sheets),
// and .pdf (digital text extraction with Tesseract OCR fallback).
package parser

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

var SupportedExtensions = map[string]bool{
	".txt":  true,
	".pdf":  true,
	".docx": true,
	".xlsx": true,
}

// IsSupported returns true if the file extension is supported for text extraction.
func IsSupported(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	return SupportedExtensions[ext]
}

// ExtractText extracts plain text from a supported file.
// For PDFs, use PDFExtractor.ExtractText() instead (requires OCR support).
func ExtractText(path string) (string, error) {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".txt":
		return extractTXT(path)
	case ".docx":
		return extractDOCX(path)
	case ".xlsx":
		return extractXLSX(path)
	case ".pdf":
		return "", fmt.Errorf("PDF requires OCR-based extraction; use PDFExtractor.ExtractText()")
	default:
		return "", fmt.Errorf("unsupported extension: %s", ext)
	}
}

func extractTXT(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("read txt: %w", err)
	}
	return string(data), nil
}

func extractDOCX(path string) (string, error) {
	r, err := zip.OpenReader(path)
	if err != nil {
		return "", fmt.Errorf("open docx zip: %w", err)
	}
	defer r.Close()

	var textParts []string

	for _, f := range r.File {
		if f.Name != "word/document.xml" {
			continue
		}

		rc, err := f.Open()
		if err != nil {
			return "", fmt.Errorf("open document.xml: %w", err)
		}
		defer rc.Close()

		text, err := parseWordXML(rc)
		if err != nil {
			return "", fmt.Errorf("parse document.xml: %w", err)
		}
		textParts = append(textParts, text)
	}

	if len(textParts) == 0 {
		return "", fmt.Errorf("docx: no document.xml found")
	}

	return strings.Join(textParts, "\n"), nil
}

func parseWordXML(r io.Reader) (string, error) {
	decoder := xml.NewDecoder(r)
	var result strings.Builder
	var insideText bool
	var currentParagraph strings.Builder

	for {
		token, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", err
		}

		switch t := token.(type) {
		case xml.StartElement:
			if t.Name.Local == "t" && t.Name.Space == "http://schemas.openxmlformats.org/wordprocessingml/2006/main" {
				insideText = true
			}
			if t.Name.Local == "tab" && t.Name.Space == "http://schemas.openxmlformats.org/wordprocessingml/2006/main" {
				currentParagraph.WriteString("\t")
			}
		case xml.EndElement:
			if t.Name.Local == "t" {
				insideText = false
			}
			if t.Name.Local == "p" && t.Name.Space == "http://schemas.openxmlformats.org/wordprocessingml/2006/main" {
				line := strings.TrimSpace(currentParagraph.String())
				if line != "" {
					result.WriteString(line)
					result.WriteString("\n")
				}
				currentParagraph.Reset()
			}
		case xml.CharData:
			if insideText {
				currentParagraph.Write(t)
			}
		}
	}

	if remaining := strings.TrimSpace(currentParagraph.String()); remaining != "" {
		result.WriteString(remaining)
		result.WriteString("\n")
	}

	return result.String(), nil
}

func extractXLSX(path string) (string, error) {
	r, err := zip.OpenReader(path)
	if err != nil {
		return "", fmt.Errorf("open xlsx zip: %w", err)
	}
	defer r.Close()

	sharedStrings, err := readSharedStrings(r)
	if err != nil {
		sharedStrings = nil
	}
	var result strings.Builder
	for _, f := range r.File {
		if !strings.HasPrefix(f.Name, "xl/worksheets/sheet") || !strings.HasSuffix(f.Name, ".xml") {
			continue
		}

		rc, err := f.Open()
		if err != nil {
			continue
		}

		text, err := parseSheetXML(rc, sharedStrings)
		rc.Close()
		if err != nil {
			continue
		}

		if text != "" {
			result.WriteString(text)
			result.WriteString("\n")
		}
	}

	return result.String(), nil
}

func readSharedStrings(r *zip.ReadCloser) ([]string, error) {
	for _, f := range r.File {
		if f.Name != "xl/sharedStrings.xml" {
			continue
		}

		rc, err := f.Open()
		if err != nil {
			return nil, err
		}
		defer rc.Close()

		data, err := io.ReadAll(rc)
		if err != nil {
			return nil, err
		}

		return parseSharedStringsXML(data)
	}
	return nil, fmt.Errorf("no sharedStrings.xml")
}

func parseSharedStringsXML(data []byte) ([]string, error) {
	decoder := xml.NewDecoder(bytes.NewReader(data))
	var strings_list []string
	var insideT bool
	var current strings.Builder

	for {
		token, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		switch t := token.(type) {
		case xml.StartElement:
			if t.Name.Local == "t" {
				insideT = true
				current.Reset()
			}
		case xml.EndElement:
			if t.Name.Local == "t" {
				insideT = false
			}
			if t.Name.Local == "si" {
				strings_list = append(strings_list, current.String())
				current.Reset()
			}
		case xml.CharData:
			if insideT {
				current.Write(t)
			}
		}
	}
	return strings_list, nil
}

func parseSheetXML(r io.Reader, sharedStrings []string) (string, error) {
	decoder := xml.NewDecoder(r)
	var result strings.Builder
	var currentRow []string
	var cellValue strings.Builder
	var cellType string
	var insideV bool

	for {
		token, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", err
		}

		switch t := token.(type) {
		case xml.StartElement:
			switch t.Name.Local {
			case "row":
				currentRow = nil
			case "c":
				cellType = ""
				cellValue.Reset()
				for _, attr := range t.Attr {
					if attr.Name.Local == "t" {
						cellType = attr.Value
					}
				}
			case "v":
				insideV = true
				cellValue.Reset()
			}
		case xml.EndElement:
			switch t.Name.Local {
			case "v":
				insideV = false
			case "c":
				val := cellValue.String()
				if cellType == "s" && sharedStrings != nil {
					idx := 0
					fmt.Sscanf(val, "%d", &idx)
					if idx >= 0 && idx < len(sharedStrings) {
						val = sharedStrings[idx]
					}
				}
				if val != "" {
					currentRow = append(currentRow, val)
				}
			case "row":
				if len(currentRow) > 0 {
					result.WriteString(strings.Join(currentRow, " | "))
					result.WriteString("\n")
				}
			}
		case xml.CharData:
			if insideV {
				cellValue.Write(t)
			}
		}
	}

	return result.String(), nil
}
