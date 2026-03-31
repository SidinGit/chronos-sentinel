use crate::grpc::activity::{telemetry_client::TelemetryClient, ActivityFrame};
use sqlx::{SqlitePool, Row};
use std::time::Duration;
use tokio::time::sleep;
use tonic::metadata::MetadataValue;
use tonic::Request;
use crate::sniffer;

pub async fn start_sync_engine(pool: SqlitePool, api_key: String, endpoint: String) {
    let hardware_id = match hostname::get() {
        Ok(name) => name.to_string_lossy().into_owned(),
        Err(_) => "Unknown".to_string(),
    };

    println!("Starting telemetry sync engine...");

    loop {
        // 1. Establish gRPC Client with infinite retry
        let mut client = match TelemetryClient::connect(endpoint.clone()).await {
            Ok(c) => c,
            Err(_) => {
                sleep(Duration::from_secs(5)).await;
                continue; // Retry connection loop
            }
        };

        println!("Connected to Nexus Stream!");

        // 2. Setup the stream channel (Async MPSC)
        let (tx, rx) = tokio::sync::mpsc::channel(100);

        let api_key_clone = api_key.clone();
        
        // 3. Attach metadata interceptor via tonic request
        let mut request = Request::new(tokio_stream::wrappers::ReceiverStream::new(rx));
        let token = MetadataValue::try_from(format!("Bearer {}", api_key_clone)).unwrap();
        request.metadata_mut().insert("authorization", token);

        // 4. Background Task: Read from SQLite + current pulse and push to TX
        // MUST SPWAN BEFORE AWAITING client.stream_logs() TO PREVENT DEADLOCK
        let tx_clone = tx.clone();
        drop(tx); // Crucial: close the original sender handle so the stream fully closes if this task dies

        let pool_clone = pool.clone();
        let hw_clone = hardware_id.clone();
        
        tokio::spawn(async move {
            loop {
                // A. Send Current Activity Pulse (Real-time tracking for Dashboard)
                if let Some(active) = sniffer::get_active_window() {
                    let pulse = ActivityFrame {
                        uuid: "pulse".to_string(),
                        device_id: hw_clone.clone(),
                        app_name: active.app_name.clone(),
                        window_title: active.title.clone(),
                        start_time: 0,
                        duration_ms: 0,
                        is_idle: false,
                    };
                    
                    if tx_clone.send(pulse).await.is_err() {
                        eprintln!("[Stream Task] Channel closed. Halting pulse loop.");
                        break; // Channel closed, stream down
                    } else {
                        println!("[Stream Task] Pushed live pulse to channel -> {}", active.title);
                    }
                } else {
                    println!("[Stream Task] Warning: Active window returned None.");
                }

                // B. Sync Unsent SQLite Records (The WAL backlog)
                if let Ok(records) = sqlx::query("SELECT id, app_name, window_title, start_time FROM activity_logs WHERE synced = 0 LIMIT 50")
                    .fetch_all(&pool_clone)
                    .await
                {
                    for row in records {
                        let id: String = row.get("id");
                        let app_name: String = row.get("app_name");
                        let title: String = row.get("window_title");
                        let start_time_sql: i64 = row.get("start_time");

                        let frame = ActivityFrame {
                            uuid: id,
                            device_id: hw_clone.clone(),
                            app_name,
                            window_title: title,
                            start_time: start_time_sql,
                            duration_ms: 0,
                            is_idle: false,
                        };

                        if tx_clone.send(frame).await.is_err() {
                            break;
                        }
                    }
                }

                sleep(Duration::from_secs(2)).await; // Cadence
            }
        });

        // 5. Send request and get response stream
        let mut response_stream = match client.stream_logs(request).await {
            Ok(resp) => {
                println!("Stream fully established & acknowledged by Nexus!");
                resp.into_inner()
            },
            Err(e) => {
                eprintln!("Failed to initiate stream: {:?}", e);
                sleep(Duration::from_secs(5)).await;
                continue; // Reconnect entirely
            }
        };

        // 6. Listen for Acks and update SQLite `synced = 1`
        loop {
            match response_stream.message().await {
                Ok(Some(ack)) => {
                    if ack.success && ack.last_processed_uuid != "pulse" {
                        let _ = sqlx::query("UPDATE activity_logs SET synced = 1 WHERE id = ?")
                            .bind(&ack.last_processed_uuid)
                            .execute(&pool)
                            .await;
                    }
                }
                Ok(None) => {
                    println!("Server closed stream.");
                    break; 
                }
                Err(e) => {
                    eprintln!("Stream error: {:?}", e);
                    break; 
                }
            }
        }

        println!("Stream severed. Reconnecting...");
        sleep(Duration::from_secs(3)).await;
    }
}
