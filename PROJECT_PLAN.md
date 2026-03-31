# 🛰️ Chronos-Sentinel: Master Development Plan
**Internal Code-name:** *Antigravity* **Architect:** Siddhartha (SDE @ Pepper Square)  
**Vision:** A zero-lag, headless telemetry system for cross-platform work tracking with automated timesheet generation.

---

## 🛠️ System Architecture (HLD)
The system follows a **Producer-Consumer-Observer** pattern:
1.  **Producer (Rust Agent):** "The Sentinel" — Low-level OS hooks, SQLite WAL buffer.
2.  **Ingestor (Go Nexus):** "The Pipe" — gRPC Bi-directional streaming, Worker pools.
3.  **Processor (Go Aggregator):** "The Brain" — Compresses raw 1s heartbeats into Work Sessions.
4.  **Consumer (Next.js Dashboard):** "The Command Center" — RBAC-enabled analytics and manual confirmation.

---

## ✅ Completed: Foundation & Data Ingestion (Phases 1-3)
*Status: Infrastructure is solid. Data flows from Desktop to Cloud.*

### 1. Monorepo & Contract
* [x] **Turborepo Setup:** Orchestration for Rust, Go, and Next.js.
* [x] **gRPC Protocol:** Defined `activity.proto` with `Telemetry` and `Auth` services.
* [x] **Shared Config:** Strict TypeScript and ESLint presets in `packages/config`.

### 2. The Sentinel (Desktop Agent)
* [x] **Rust OS Hooks:** Active window detection (Win32/AppKit) with <1% CPU overhead.
* [x] **Offline-First:** Local SQLite persistence to prevent data loss during network drops.
* [x] **Idle Detection:** Automatic tracking pause based on system-wide mouse/keyboard inactivity.
* [x] **Secure Auth:** Integration with Windows Credential Manager/macOS Keychain for API Key storage.

### 3. The Nexus (Backend)
* [x] **Go Ingestor:** High-concurrency gRPC server using Goroutines.
* [x] **Worker Pool:** Fan-in pattern to batch-process 100+ logs at a time into MongoDB.
* [x] **Device Pairing:** 6-digit "TV-style" pairing flow to link hardware to web accounts.

---

## 🚀 Upcoming: The "Antigravity" High-Performance Phases

### Phase 4: Data Intelligence (The Aggregator)
*Goal: Turn "Data Noise" into "Work Insights".*
* [ ] **Session Compression:** Implement the Go logic to merge identical consecutive 1s logs into a single `Session` object (e.g., *45 mins in VS Code*).
* [ ] **Privacy Scrubbing:** Add a local Rust filter to prevent sensitive titles (Banking, Incognito) from leaving the device.
* [ ] **The "Pulse" API:** Create a high-speed endpoint to show "Current Activity" on the web dashboard.

### Phase 5: The Command Center (Web UI)
*Goal: A professional-grade management experience.*
* [ ] **Daily Timeline View:** A visual Gantt chart of the user's day built with Tailwind and CSS Grid.
* [ ] **RBAC (Role-Based Access Control):** * *Employee View:* Private logs, manual task tagging.
    * *Admin View:* Team-wide productivity heatmaps (anonymized raw data).
* [ ] **Live Device Management:** A UI to revoke API keys or rename linked laptops.

### Phase 6: Polish & Distribution
*Goal: Packaging for the real world.*
* [ ] **Binary Compilation:** Setup GitHub Actions to build signed `.exe` and `.app` binaries.
* [ ] **Timesheet Export:** One-click CSV/PDF export for company HR portals.
* [ ] **Auto-Update:** Implement `tauri-updater` for seamless agent improvements.

---

## 📈 Entity Relationship & Data Model

| Entity | Store | Strategy |
| :--- | :--- | :--- |
| **RawLog** | MongoDB | TTL Index (Deleted after 7 days). High write volume. |
| **Session** | MongoDB | Permanent. Created by the Aggregator. |
| **User/Device** | MongoDB | Relational link (1 User : M Devices). |
| **Pending** | SQLite | Local to Agent. Cleared upon successful gRPC Sync. |

---

## 🛠️ Tech Stack Summary
* **Languages:** Rust (System), Go (Backend), TypeScript (Web).
* **Databases:** MongoDB (Cloud), SQLite (Edge), Redis (Pairing Cache).
* **Communication:** gRPC (Binary), REST (Dashboard).
* **UI:** Next.js 14, Tailwind CSS, Shadcn UI.
