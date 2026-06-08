// Package security provides input protection mechanisms: off-topic query
// filtering via regex, sliding-window rate limiting with auto-ban, XSS
// payload detection, and HTML entity escaping.
package security

import (
	"regexp"
	"strings"
)


var compiledOffTopicRegex *regexp.Regexp
// init compiles the off-topic regex when the package is loaded.
// It matches ~30 Ukrainian and English patterns including prompt injections, 
// jailbreaks, and common off-topic queries.
func init() {

	patterns := []string{
		`рецепт\b`,
		`напиши (код|вірш|пісню|лист|резюме)`,
		`розкажи (анекдот|жарт)`,
		`анекдот\b`,
		`допоможи (з домашнім|написати|зробити) (завданн|курсов|дипломн)`,
		`домашнє завдання\b`,
		`ігнорувати попередні інструкції`,
		`ігноруй (усі )?інструкції`,
		`ти (людина|не бот|не aii?)`,
		`який сьогодні (день|дата)`,
		`яка (погода|температура)`,
		`прогноз погоди`,
		`курс (валют|долар|євро)`,
		`зламай(ку|те)? `, `злом `, `хакер\b`,
		`переклади (текст|це|документ)`,


		`recipe\s+for\b`,
		`write (me )?(a |some )?(code|poem|song|story|essay|resume|cover letter)`,
		`tell (me )?(a )?joke\b`,
		`(help|do) (with |my )?homework\b`,
		`ignore (all )?previous instructions`,
		`ignore (all )?(prior|earlier) instructions`,
		`forget everything (i told|above)`,
		`are you (a |really )?(human|real person|alive|sentient)`,
		`(weather|forecast) (today|tomorrow|this week)`,
		`exchange rate\b`, `currency rate\b`,
		`translate (this|the following|my)`,
		`write (my |a )?resume\b`,
		`\bhack(ing|er)?\b`,
		`sql injection\b`,
		`how (are you|were you) (built|made|trained|created)\b`,
		`drop table\b`,
		`select\s+\*\s+from\b`,

		`\bsystem:\s`,
		`\bassistant:\s`,
		`act as (a |an )?(different|new|evil|unrestricted|pirate|hacker|villain)`,
		`pretend (you are|to be) (a |an )?(jailbroken|free|evil|unethical|hacker|pirate)`,
		`\bjailbreak\b`,
		`\bdan mode\b`,
		`new (system )?instructions?\b`,
	}

	pattern := `(?i)(` + strings.Join(patterns, "|") + `)`
	compiledOffTopicRegex = regexp.MustCompile(pattern)
}
// OffTopicFilter detects off-topic and prompt-injection queries using
// a precompiled regex matching ~30 patterns in Ukrainian and English.
type OffTopicFilter struct{}

// NewOffTopicFilter creates a new OffTopicFilter.
func NewOffTopicFilter() *OffTopicFilter {
	return &OffTopicFilter{}
}

// IsOffTopic returns true if the query matches any off-topic or
// prompt-injection pattern.
func (f *OffTopicFilter) IsOffTopic(query string) bool {
	return compiledOffTopicRegex.MatchString(query)
}
