package main

import "time"

// SessionProcessor contains the core session compression algorithm.
// It is deliberately stateless — takes raw logs in, returns sessions out.
// This makes it trivially unit-testable with no database dependencies.
type SessionProcessor struct{}

func NewSessionProcessor() *SessionProcessor {
	return &SessionProcessor{}
}

// groupKey identifies a unique session stream. Sessions are grouped by
// device and application — not by window title, which changes too frequently.
type groupKey struct {
	DeviceID string
	AppName  string
}

// Compress merges raw 1-second heartbeats into continuous work sessions.
//
// Algorithm:
//  1. Group all logs by (device_id, app_name)
//  2. Within each group (already sorted by start_time from the DB query):
//     - Idle heartbeats act as hard session boundaries
//     - Gaps exceeding GapTolerance (5 min) start a new session
//     - Everything else extends the current session
//
// Time complexity: O(n) single pass over pre-sorted input.
func (p *SessionProcessor) Compress(logs []RawLog) []Session {
	if len(logs) == 0 {
		return nil
	}

	// Phase 1: Bucket logs by (device, app)
	groups := make(map[groupKey][]RawLog)
	for _, log := range logs {
		key := groupKey{DeviceID: log.DeviceID, AppName: log.AppName}
		groups[key] = append(groups[key], log)
	}

	// Phase 2: Merge each bucket into sessions
	var sessions []Session

	for _, groupLogs := range groups {
		var current *Session

		for _, log := range groupLogs {
			// Rule 1: Idle heartbeats are hard session boundaries.
			// The Rust agent sets is_idle when system-wide input (mouse/keyboard)
			// has been silent for 5+ minutes. This is a definitive "user left."
			if log.IsIdle {
				if current != nil {
					sessions = append(sessions, *current)
					current = nil
				}
				continue
			}

			// Rule 2: First non-idle log starts a fresh session.
			if current == nil {
				current = newSession(log)
				continue
			}

			// Rule 3: If the gap between the end of the current session and
			// this log exceeds GapTolerance, the user context-switched away
			// and came back. Treat as a new session.
			gap := time.Duration(log.StartTime-current.EndTime) * time.Millisecond
			if gap > GapTolerance {
				sessions = append(sessions, *current)
				current = newSession(log)
				continue
			}

			// Rule 4: Extend the active session.
			current.EndTime = log.StartTime + log.DurationMs
			current.DurationMs = current.EndTime - current.StartTime
			current.HeartbeatCount++
		}

		// Flush the last active session in this group
		if current != nil {
			sessions = append(sessions, *current)
		}
	}

	return sessions
}

// newSession initializes a Session from a single heartbeat.
func newSession(log RawLog) *Session {
	return &Session{
		DeviceID:       log.DeviceID,
		AppName:        log.AppName,
		StartTime:      log.StartTime,
		EndTime:        log.StartTime + log.DurationMs,
		DurationMs:     log.DurationMs,
		HeartbeatCount: 1,
		CreatedAt:      time.Now(),
	}
}
