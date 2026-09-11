package sqlite

import "time"

// nullTime converts *time.Time to a nullable value for SQLite DATETIME columns.
// Returns nil when the pointer is nil (stored as SQL NULL), otherwise the time value.
func nullTime(t *time.Time) interface{} {
	if t == nil {
		return nil
	}
	return *t
}

// parseSQLTime parses a SQLite datetime string supporting multiple format variations.
// Returns nil if empty or invalid.
func parseSQLTime(s string) *time.Time {
	if s == "" {
		return nil
	}
	formats := []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02 15:04:05.999999999-07:00",
		"2006-01-02 15:04:05.999999999",
		"2006-01-02 15:04:05-07:00",
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05",
		"2006-01-02",
	}
	for _, fmtStr := range formats {
		if t, err := time.Parse(fmtStr, s); err == nil && !t.IsZero() && t.Year() > 1 {
			return &t
		}
	}
	return nil
}
