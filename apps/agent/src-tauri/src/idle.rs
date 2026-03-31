use std::time::Duration;

#[cfg(target_os = "windows")]
pub fn get_idle_time() -> Duration {
    use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
    use windows::Win32::System::SystemInformation::GetTickCount;

    unsafe {
        let mut lii = LASTINPUTINFO {
            cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };
        if GetLastInputInfo(&mut lii).as_bool() {
            let uptime = GetTickCount();
            let idle_ms = uptime - lii.dwTime;
            Duration::from_millis(idle_ms as u64)
        } else {
            Duration::from_secs(0)
        }
    }
}

#[cfg(target_os = "macos")]
pub fn get_idle_time() -> Duration {
    // macOS uses IOKit to check for "HIDIdleTime"
    // For brevity in this snippet, we'll return 0. 
    // In production, you'd use `io_iterator_t` to query the IOHIDSystem.
    Duration::from_secs(0) 
}