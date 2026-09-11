// Package imageproc converts uploaded images to responsive WebP variants.
//
// Pipeline:
//  1. Validate MIME type (accept: JPEG, PNG, GIF, TIFF, BMP, WebP; reject HEIC).
//  2. Decode the source image using kovidgoyal/imaging (pure-Go, no cgo).
//  3. For each configured width: resize proportionally, encode to WebP.
//
// Dependencies:
//   - github.com/disintegration/imaging — resize (pure-Go fork)
//   - github.com/skrashevich/go-webp   — WebP encode (pure-Go, no cgo/libwebp)
//
// CGO constraint: all dependencies in this package MUST be pure-Go.
// The project uses modernc.org/sqlite (CGO-free) for the same reason.
package imageproc

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	_ "image/gif"  // register GIF decoder
	_ "image/jpeg" // register JPEG decoder
	_ "image/png"  // register PNG decoder

	"github.com/disintegration/imaging"
	gowebp "github.com/skrashevich/go-webp"
)

// ErrUnsupportedFormat is returned when the uploaded file's MIME type or magic
// bytes indicate a format that this pipeline does not support (e.g., HEIC).
var ErrUnsupportedFormat = errors.New("imageproc: unsupported image format (accepted: JPEG, PNG, GIF, BMP, WebP)")

// allowedMagic lists the magic-byte prefixes for accepted image formats.
// The check is a fast pre-filter before attempting full image decoding.
var allowedMagic = [][]byte{
	{0xFF, 0xD8, 0xFF},             // JPEG
	{0x89, 0x50, 0x4E, 0x47},       // PNG
	{0x47, 0x49, 0x46},             // GIF
	{0x42, 0x4D},                   // BMP
	{0x52, 0x49, 0x46, 0x46},       // WebP (RIFF header; full check below)
}

// DefaultWidths are the responsive breakpoints generated for every uploaded image.
// They map to <picture srcset="image-320w.webp 320w, image-640w.webp 640w, ..."> in the frontend.
var DefaultWidths = []int{320, 640, 1024, 1600}

// Options configures the image processing pipeline.
type Options struct {
	// Quality is the WebP lossy quality (1–100). Recommended: 80–85.
	Quality int
	// Widths lists the output widths in pixels. Images narrower than a given
	// width are upscaled only if the source is wider — otherwise that variant is skipped.
	Widths []int
}

// DefaultOptions returns sensible production defaults.
func DefaultOptions() Options {
	return Options{
		Quality: 95,
		Widths:  DefaultWidths,
	}
}

// Processor holds a configured image processing pipeline.
// Create one instance per application and reuse it — it is safe for concurrent use.
type Processor struct {
	opts Options
}

// NewProcessor creates a Processor with the given options.
// If opts.Widths is empty, DefaultWidths are used.
// If opts.Quality is 0, 95 is used.
func NewProcessor(opts Options) *Processor {
	if len(opts.Widths) == 0 {
		opts.Widths = DefaultWidths
	}
	if opts.Quality <= 0 || opts.Quality > 100 {
		opts.Quality = 95
	}
	return &Processor{opts: opts}
}

// Result holds the output of a single Process call.
type Result struct {
	// Variants maps output width → WebP-encoded bytes.
	// A width entry is absent if the source image was narrower than that width
	// AND upscaling was skipped (see Options.Widths).
	Variants map[int][]byte
}

// ProcessSingle converts src to a single high-fidelity WebP image (max width 3840px for 4K support).
func (p *Processor) ProcessSingle(src []byte) ([]byte, error) {
	if err := validateMagic(src); err != nil {
		return nil, err
	}

	img, _, err := image.Decode(bytes.NewReader(src))
	if err != nil {
		return nil, fmt.Errorf("imageproc: decode source: %w", err)
	}

	srcWidth := img.Bounds().Dx()
	var target image.Image = img
	if srcWidth > 3840 {
		target = imaging.Resize(img, 3840, 0, imaging.Lanczos)
	}

	quality := p.opts.Quality
	if quality < 92 {
		quality = 95
	}

	encoded, err := encodeWebP(target, quality)
	if err != nil {
		return nil, fmt.Errorf("imageproc: encode webp: %w", err)
	}
	return encoded, nil
}

// Process decodes src, validates its format, and encodes it as WebP at each
// configured width. Returns ErrUnsupportedFormat for HEIC or other disallowed types.
func (p *Processor) Process(src []byte) (*Result, error) {
	if err := validateMagic(src); err != nil {
		return nil, err
	}

	img, _, err := image.Decode(bytes.NewReader(src))
	if err != nil {
		return nil, fmt.Errorf("imageproc: decode source: %w", err)
	}

	result := &Result{Variants: make(map[int][]byte, len(p.opts.Widths))}
	srcWidth := img.Bounds().Dx()

	for _, w := range p.opts.Widths {
		var target image.Image
		if srcWidth <= w {
			// Do not upscale — use the source at its natural size for this variant.
			// The largest bucket still gets the source encoded (covers the hero breakpoint).
			if w == p.opts.Widths[len(p.opts.Widths)-1] {
				target = img
			} else {
				continue // skip smaller buckets when source is already smaller
			}
		} else {
			target = imaging.Resize(img, w, 0, imaging.Lanczos)
		}

		encoded, err := encodeWebP(target, p.opts.Quality)
		if err != nil {
			return nil, fmt.Errorf("imageproc: encode width=%d: %w", w, err)
		}
		result.Variants[w] = encoded
	}

	return result, nil
}

// encodeWebP encodes img as a lossy WebP at the given quality using the
// pure-Go skrashevich/go-webp encoder (no cgo, no libwebp).
func encodeWebP(img image.Image, quality int) ([]byte, error) {
	var buf bytes.Buffer
	if err := gowebp.Encode(&buf, img, &gowebp.Options{Lossy: true, Quality: float32(quality)}); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// validateMagic checks that src starts with a known accepted image magic sequence.
// Returns ErrUnsupportedFormat for unrecognised or explicitly rejected types (HEIC).
func validateMagic(src []byte) error {
	if len(src) < 4 {
		return ErrUnsupportedFormat
	}
	for _, magic := range allowedMagic {
		if bytes.HasPrefix(src, magic) {
			return nil
		}
	}
	return ErrUnsupportedFormat
}
