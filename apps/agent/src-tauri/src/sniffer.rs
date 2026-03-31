use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct WindowActivity {
    pub app_name: String,
    pub title: String,
}

#[cfg(target_os = "windows")]
pub fn get_active_window() -> Option<WindowActivity> {
    use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId};
    use windows::Win32::System::Threading::{OpenProcess, QueryFullProcessImageNameW, PROCESS_QUERY_LIMITED_INFORMATION};
    
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0 == 0 { return None; }

        let mut buffer = [0u16; 512];
        let len = GetWindowTextW(hwnd, &mut buffer);
        let title = String::from_utf16_lossy(&buffer[..len as usize]);

        let mut pid = 0;
        let _ = GetWindowThreadProcessId(hwnd, Some(&mut pid));

        let mut app_name = format!("PID:{}", pid);
        
        // Try to fetch the exact .exe name mapping to the frontend
        if let Ok(process_handle) = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
            let mut exe_buffer = [0u16; 1024];
            let mut size = exe_buffer.len() as u32;
            
            if QueryFullProcessImageNameW(process_handle, windows::Win32::System::Threading::PROCESS_NAME_FORMAT(0), windows::core::PWSTR::from_raw(exe_buffer.as_mut_ptr()), &mut size).is_ok() {
                let full_path = String::from_utf16_lossy(&exe_buffer[..size as usize]);
                // We only want the application name (e.g. "chrome.exe")
                if let Some(exe_name) = std::path::Path::new(&full_path).file_name().and_then(|n| n.to_str()) {
                    app_name = exe_name.to_string();
                    
                    // Cleanup common extension for sleeker UI
                    if app_name.to_lowercase().ends_with(".exe") {
                        app_name = app_name[..app_name.len() - 4].to_string();
                    }
                }
            }
            let _ = windows::Win32::Foundation::CloseHandle(process_handle);
        }

        Some(WindowActivity {
            app_name, 
            title,
        })
    }
}

#[cfg(target_os = "macos")]
pub fn get_active_window() -> Option<WindowActivity> {
    // In macOS, we use the NSWorkspace API via objc2
    // This is a high-level abstraction for the demo
    use objc2_app_kit::NSWorkspace;
    
    let workspace = unsafe { NSWorkspace::sharedWorkspace() };
    let app = unsafe { workspace.frontmostApplication() };
    
    if let Some(app) = app {
        let name = unsafe { app.localizedName().unwrap().to_string() };
        // Title capture on Mac requires Accessibility Permissions
        Some(WindowActivity {
            app_name: name,
            title: "Active Window".to_string(),
        })
    } else {
        None
    }
}