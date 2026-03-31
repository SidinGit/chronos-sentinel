use crate::grpc::activity::{auth_service_client::AuthServiceClient, PairingRequest};
use keyring::Entry;
use std::time::Duration;
use tokio::time::sleep;

const KEYRING_SERVICE: &str = "chronos-sentinel";
const KEYRING_USER: &str = "device-api-key";

/// Returns the stored API key, or None if the device is not paired.
pub fn get_api_key() -> Option<String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER).ok()?;
    entry.get_password().ok()
}

/// Stores the API key securely in the OS Native Keyring.
pub fn save_api_key(key: &str) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| format!("Keyring error: {:?}", e))?;
    entry.set_password(key).map_err(|e| format!("Failed to save key: {:?}", e))?;
    Ok(())
}

pub async fn get_pairing_code_rpc(endpoint: &str, hardware_id: &str) -> Result<String, String> {
    let mut client = loop {
        match AuthServiceClient::connect(endpoint.to_string()).await {
            Ok(c) => break c,
            Err(_) => {
                sleep(Duration::from_secs(2)).await;
            }
        }
    };

    let req = tonic::Request::new(PairingRequest {
        hardware_id: hardware_id.to_string(),
    });

    let resp = client.initiate_pairing(req).await
        .map_err(|e| format!("RPC failed: {}", e))?.into_inner();
    
    Ok(resp.user_code)
}

pub async fn poll_pairing_status(endpoint: &str, hardware_id: &str) -> Result<String, String> {
    let mut client = AuthServiceClient::connect(endpoint.to_string()).await
        .map_err(|_| "Failed to connect to Ingestor".to_string())?;

    loop {
        sleep(Duration::from_secs(3)).await;
        let req = tonic::Request::new(PairingRequest {
            hardware_id: hardware_id.to_string(),
        });
        
        if let Ok(resp) = client.check_pairing_status(req).await {
            let status = resp.into_inner();
            if status.authenticated {
                return Ok(status.api_key);
            }
        }
    }
}