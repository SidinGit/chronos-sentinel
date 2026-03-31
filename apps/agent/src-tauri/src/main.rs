mod sniffer;
mod db;
mod idle;
mod grpc;
mod auth;
mod telemetry;

use std::time::{Duration, SystemTime, UNIX_EPOCH};
use ulid::Ulid;
use once_cell::sync::Lazy;
use std::sync::Mutex;

// Global state for Tauri to read the pairing code
static PAIRING_CODE: Lazy<Mutex<String>> = Lazy::new(|| Mutex::new(String::new()));
static IS_PAIRED: Lazy<Mutex<bool>> = Lazy::new(|| Mutex::new(false));

#[tauri::command]
fn get_pairing_code() -> String {
    PAIRING_CODE.lock().unwrap().clone()
}

#[tauri::command]
fn get_pairing_status() -> bool {
    *IS_PAIRED.lock().unwrap()
}

#[tokio::main]
async fn main() {
    let pool = db::init_db("chronos.db").await;
    let endpoint = "http://localhost:50051".to_string(); // In production, read from config

    // Check Keyring Status
    if let Some(api_key) = auth::get_api_key() {
        println!("API Key found. Launching directly cleanly.");
        *IS_PAIRED.lock().unwrap() = true;

        let pool_clone = pool.clone();
        let endpoint_clone = endpoint.clone();
        
        tokio::spawn(async move {
            telemetry::start_sync_engine(pool_clone, api_key, endpoint_clone).await;
        });
    } else {
        println!("No API Key. Initiating Pairing Mode.");

        let hardware_id = match hostname::get() {
            Ok(name) => name.to_string_lossy().into_owned(),
            Err(_) => "Unknown".to_string(),
        };

        let pool_clone = pool.clone();
        let endpoint_clone = endpoint.clone();
        
        // Spawn pairing process
        tokio::spawn(async move {
            match auth::get_pairing_code_rpc(&endpoint_clone, &hardware_id).await {
                Ok(code) => {
                    *PAIRING_CODE.lock().unwrap() = code.clone();
                    
                    match auth::poll_pairing_status(&endpoint_clone, &hardware_id).await {
                        Ok(api_key) => {
                            let _ = auth::save_api_key(&api_key);
                            *IS_PAIRED.lock().unwrap() = true;
                            // Start sync engine immediately after pairing
                            telemetry::start_sync_engine(pool_clone, api_key, endpoint_clone).await;
                        }
                        Err(e) => eprintln!("Polling failed: {}", e),
                    }
                }
                Err(e) => {
                    eprintln!("Failed to get pairing code: {}", e);
                }
            }
        });
    }

    // Background Thread: The Sentinel (Sniffer + Idle Detection)
    let db_pool = pool.clone();
    tokio::spawn(async move {
        let mut last_title = String::new();
        let idle_threshold = Duration::from_secs(300);

        loop {
            let idle_time = idle::get_idle_time();
            
            if idle_time < idle_threshold {
                if let Some(activity) = sniffer::get_active_window() {
                    // Only log to SQLite locally if window changed.
                    // (Pulse goes independently every second in telemetry.rs)
                    if activity.title != last_title {
                        let now = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as i64;
                        
                        let log_id = Ulid::new().to_string();

                        // Synced = 0 allows the Sync Engine to pick it up later
                        let _ = sqlx::query(
                            "INSERT INTO activity_logs (id, app_name, window_title, start_time, synced) 
                             VALUES (?, ?, ?, ?, 0)"
                        )
                        .bind(&log_id)
                        .bind(&activity.app_name)
                        .bind(&activity.title)
                        .bind(now)
                        .execute(&db_pool)
                        .await;

                        last_title = activity.title;
                    }
                }
            } else {
                if !last_title.is_empty() {
                    println!("System Idle: Local tracking paused.");
                    last_title = String::new();
                }
            }
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    });

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_pairing_code, get_pairing_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
