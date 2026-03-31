package main

import (
	"testing"
)

// TestCompressContiguousLogs verifies that consecutive heartbeats for the
// same app on the same device merge into a single session.
func TestCompressContiguousLogs(t *testing.T) {
	p := NewSessionProcessor()

	logs := []RawLog{
		{UUID: "1", DeviceID: "D1", AppName: "Code.exe", StartTime: 1000, DurationMs: 1000},
		{UUID: "2", DeviceID: "D1", AppName: "Code.exe", StartTime: 2000, DurationMs: 1000},
		{UUID: "3", DeviceID: "D1", AppName: "Code.exe", StartTime: 3000, DurationMs: 1000},
	}

	sessions := p.Compress(logs)

	if len(sessions) != 1 {
		t.Fatalf("expected 1 session, got %d", len(sessions))
	}

	s := sessions[0]
	if s.StartTime != 1000 {
		t.Errorf("start_time: expected 1000, got %d", s.StartTime)
	}
	if s.EndTime != 4000 {
		t.Errorf("end_time: expected 4000, got %d", s.EndTime)
	}
	if s.DurationMs != 3000 {
		t.Errorf("duration_ms: expected 3000, got %d", s.DurationMs)
	}
	if s.HeartbeatCount != 3 {
		t.Errorf("heartbeat_count: expected 3, got %d", s.HeartbeatCount)
	}
}

// TestCompressGapBreaksSession verifies that a gap exceeding GapTolerance
// (5 minutes = 300,000ms) splits the logs into two sessions.
func TestCompressGapBreaksSession(t *testing.T) {
	p := NewSessionProcessor()

	logs := []RawLog{
		{UUID: "1", DeviceID: "D1", AppName: "Code.exe", StartTime: 1000, DurationMs: 1000},
		{UUID: "2", DeviceID: "D1", AppName: "Code.exe", StartTime: 2000, DurationMs: 1000},
		// 6-minute gap (360,000ms) — exceeds 5min tolerance
		{UUID: "3", DeviceID: "D1", AppName: "Code.exe", StartTime: 362000, DurationMs: 1000},
	}

	sessions := p.Compress(logs)

	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions, got %d", len(sessions))
	}

	if sessions[0].EndTime != 3000 {
		t.Errorf("session 1 end_time: expected 3000, got %d", sessions[0].EndTime)
	}
	if sessions[1].StartTime != 362000 {
		t.Errorf("session 2 start_time: expected 362000, got %d", sessions[1].StartTime)
	}
}

// TestCompressIdleBreaksSession verifies that an is_idle heartbeat acts
// as a hard session boundary — even within the gap tolerance window.
func TestCompressIdleBreaksSession(t *testing.T) {
	p := NewSessionProcessor()

	logs := []RawLog{
		{UUID: "1", DeviceID: "D1", AppName: "Code.exe", StartTime: 1000, DurationMs: 1000},
		{UUID: "2", DeviceID: "D1", AppName: "Code.exe", StartTime: 2000, DurationMs: 1000, IsIdle: true},
		{UUID: "3", DeviceID: "D1", AppName: "Code.exe", StartTime: 3000, DurationMs: 1000},
	}

	sessions := p.Compress(logs)

	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions, got %d", len(sessions))
	}

	// First session: just log 1
	if sessions[0].HeartbeatCount != 1 {
		t.Errorf("session 1 heartbeat_count: expected 1, got %d", sessions[0].HeartbeatCount)
	}
	// Second session: just log 3 (log 2 was idle, skipped)
	if sessions[1].StartTime != 3000 {
		t.Errorf("session 2 start_time: expected 3000, got %d", sessions[1].StartTime)
	}
}

// TestCompressDifferentApps verifies that logs from different apps
// produce separate sessions even when temporally adjacent.
func TestCompressDifferentApps(t *testing.T) {
	p := NewSessionProcessor()

	logs := []RawLog{
		{UUID: "1", DeviceID: "D1", AppName: "Code.exe", StartTime: 1000, DurationMs: 1000},
		{UUID: "2", DeviceID: "D1", AppName: "Chrome.exe", StartTime: 2000, DurationMs: 1000},
		{UUID: "3", DeviceID: "D1", AppName: "Code.exe", StartTime: 3000, DurationMs: 1000},
	}

	sessions := p.Compress(logs)

	// Should be 3 sessions: Code, Chrome, Code (different group keys)
	// Actually Code logs are in the same group and within gap tolerance,
	// so Code merges into 1 session. Chrome is its own session.
	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions (Code merged + Chrome), got %d", len(sessions))
	}

	// Verify we have both apps represented
	apps := make(map[string]bool)
	for _, s := range sessions {
		apps[s.AppName] = true
	}
	if !apps["Code.exe"] || !apps["Chrome.exe"] {
		t.Errorf("expected both Code.exe and Chrome.exe sessions, got %v", apps)
	}
}

// TestCompressDifferentDevices verifies that logs from different devices
// never merge, even for the same app.
func TestCompressDifferentDevices(t *testing.T) {
	p := NewSessionProcessor()

	logs := []RawLog{
		{UUID: "1", DeviceID: "D1", AppName: "Code.exe", StartTime: 1000, DurationMs: 1000},
		{UUID: "2", DeviceID: "D2", AppName: "Code.exe", StartTime: 2000, DurationMs: 1000},
	}

	sessions := p.Compress(logs)

	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions (one per device), got %d", len(sessions))
	}
}

// TestCompressEmptyInput verifies graceful handling of no data.
func TestCompressEmptyInput(t *testing.T) {
	p := NewSessionProcessor()
	sessions := p.Compress(nil)

	if sessions != nil {
		t.Fatalf("expected nil sessions for empty input, got %v", sessions)
	}
}

// TestCompressAllIdle verifies that all-idle input produces zero sessions.
func TestCompressAllIdle(t *testing.T) {
	p := NewSessionProcessor()

	logs := []RawLog{
		{UUID: "1", DeviceID: "D1", AppName: "Code.exe", StartTime: 1000, DurationMs: 1000, IsIdle: true},
		{UUID: "2", DeviceID: "D1", AppName: "Code.exe", StartTime: 2000, DurationMs: 1000, IsIdle: true},
	}

	sessions := p.Compress(logs)

	if len(sessions) != 0 {
		t.Fatalf("expected 0 sessions for all-idle input, got %d", len(sessions))
	}
}
