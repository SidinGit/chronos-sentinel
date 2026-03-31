package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// loadEnv loads the .env file from the monorepo root.
// It walks up from the current working directory looking for .env,
// so it works whether you run from apps/ingestor/ or the repo root.
//
// If no .env file is found, it silently continues — environment
// variables set in the shell or CI/CD pipeline will still apply.
func loadEnv() {
	// Try loading from current directory first
	if err := godotenv.Load(); err == nil {
		return
	}

	// Walk up to find the monorepo root .env
	dir, err := os.Getwd()
	if err != nil {
		return
	}

	for {
		envPath := filepath.Join(dir, ".env")
		if _, err := os.Stat(envPath); err == nil {
			if err := godotenv.Load(envPath); err == nil {
				log.Printf("📁 Loaded env from %s", envPath)
				return
			}
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
}
