fn main() -> Result<(), Box<dyn std::error::Error>> {
    let protoc_path = protoc_bin_vendored::protoc_bin_path().map_err(|e| format!("protoc error: {}", e))?;
    std::env::set_var("PROTOC", protoc_path);

    tonic_build::configure()
        .build_server(false) // The agent is only a client
        .compile(
            &["../../../packages/proto/activity.proto"],
            &["../../../packages/proto"],
        )?;

    tauri_build::build();
    Ok(())
}