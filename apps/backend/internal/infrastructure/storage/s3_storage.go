package storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// S3Config holds connection details for any S3-compatible provider (Cloudflare R2, AWS S3, MinIO).
type S3Config struct {
	Endpoint        string // e.g. "https://<account-id>.r2.cloudflarestorage.com"
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	Region          string // e.g. "auto" or "us-east-1"
	PublicBaseURL   string // e.g. "https://media.example.com"
}

// S3API defines the core object operations interface for testability.
type S3API interface {
	PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
	DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
	HeadObject(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error)
}

// S3PresignAPI defines the presigning interface for testability.
type S3PresignAPI interface {
	PresignPutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error)
}

// S3Storage implements MediaStorage for S3-compatible object storage using AWS SDK for Go v2.
type S3Storage struct {
	config        S3Config
	client        S3API
	presignClient S3PresignAPI
}

// NewS3Storage creates an S3Storage instance using AWS SDK v2.
func NewS3Storage(cfg S3Config) (*S3Storage, error) {
	if cfg.Endpoint == "" || cfg.Bucket == "" || cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" {
		return nil, fmt.Errorf("storage: S3 config requires Endpoint, Bucket, AccessKeyID, and SecretAccessKey")
	}
	if cfg.Region == "" {
		cfg.Region = "auto"
	}
	cfg.Endpoint = strings.TrimSuffix(cfg.Endpoint, "/")

	s3Client := s3.New(s3.Options{
		Region: cfg.Region,
		Credentials: credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		EndpointResolver: s3.EndpointResolverFunc(func(region string, options s3.EndpointResolverOptions) (aws.Endpoint, error) {
			return aws.Endpoint{
				URL:               cfg.Endpoint,
				SigningRegion:     cfg.Region,
				HostnameImmutable: true,
			}, nil
		}),
		UsePathStyle: true,
	})

	presignClient := s3.NewPresignClient(s3Client)

	return &S3Storage{
		config:        cfg,
		client:        s3Client,
		presignClient: presignClient,
	}, nil
}

// NewS3StorageWithClients allows injecting custom S3/Presign API implementations for unit testing.
func NewS3StorageWithClients(cfg S3Config, client S3API, presigner S3PresignAPI) (*S3Storage, error) {
	if cfg.Bucket == "" {
		return nil, fmt.Errorf("storage: Bucket required")
	}
	return &S3Storage{
		config:        cfg,
		client:        client,
		presignClient: presigner,
	}, nil
}

// Put uploads object data to S3 at the given storage key using AWS SDK v2.
func (s *S3Storage) Put(ctx context.Context, key string, data []byte, contentType string) error {
	cleanKey, err := sanitizeStorageKey(key)
	if err != nil {
		return err
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	cacheControl := "public, max-age=31536000, immutable"

	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.config.Bucket),
		Key:           aws.String(cleanKey),
		Body:          bytes.NewReader(data),
		ContentLength: aws.Int64(int64(len(data))),
		ContentType:   aws.String(contentType),
		CacheControl:  aws.String(cacheControl),
	})
	if err != nil {
		return fmt.Errorf("s3 put object: %w", err)
	}
	return nil
}

// Delete removes an object from S3 using AWS SDK v2.
func (s *S3Storage) Delete(ctx context.Context, key string) error {
	cleanKey, err := sanitizeStorageKey(key)
	if err != nil {
		return err
	}

	_, err = s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.config.Bucket),
		Key:    aws.String(cleanKey),
	})
	if err != nil {
		return fmt.Errorf("s3 delete object: %w", err)
	}
	return nil
}

// Exists performs a HeadObject check to verify object existence in S3 using AWS SDK v2.
func (s *S3Storage) Exists(ctx context.Context, key string) (bool, error) {
	cleanKey, err := sanitizeStorageKey(key)
	if err != nil {
		return false, err
	}

	_, err = s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.config.Bucket),
		Key:    aws.String(cleanKey),
	})
	if err != nil {
		var nfe *types.NotFound
		var nsk *types.NoSuchKey
		if errors.As(err, &nfe) || errors.As(err, &nsk) || strings.Contains(err.Error(), "404") || strings.Contains(err.Error(), "NotFound") {
			return false, nil
		}
		return false, fmt.Errorf("s3 head object: %w", err)
	}
	return true, nil
}

// PresignPut generates a short-lived presigned PUT URL for direct client upload to S3/R2.
func (s *S3Storage) PresignPut(ctx context.Context, key string, contentType string, ttl time.Duration) (string, error) {
	cleanKey, err := sanitizeStorageKey(key)
	if err != nil {
		return "", err
	}

	if ttl <= 0 {
		ttl = 15 * time.Minute
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	req, err := s.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.config.Bucket),
		Key:         aws.String(cleanKey),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(ttl))
	if err != nil {
		return "", fmt.Errorf("s3 presign put object: %w", err)
	}

	return req.URL, nil
}

func sanitizeStorageKey(key string) (string, error) {
	if strings.Contains(key, "..") {
		return "", fmt.Errorf("storage: path traversal forbidden in key: %q", key)
	}
	clean := strings.TrimPrefix(key, "/")
	clean = strings.TrimSpace(clean)
	if clean == "" {
		return "", fmt.Errorf("storage: empty key forbidden")
	}
	return clean, nil
}
