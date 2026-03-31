use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use std::str::FromStr;

pub async fn init_db(path: &str) -> SqlitePool {
    let options = SqliteConnectOptions::from_str(&format!("sqlite://{}", path))
        .unwrap()
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal); // HIGH PERFORMANCE MODE

    let pool = SqlitePool::connect_with(options).await.unwrap();

    // Create the schema
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS activity_logs (
            id TEXT PRIMARY KEY,
            app_name TEXT,
            window_title TEXT,
            start_time INTEGER,
            synced INTEGER DEFAULT 0
        )"
    ).execute(&pool).await.unwrap();

    pool
}