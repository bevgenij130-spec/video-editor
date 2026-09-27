//! Video editor backend skeleton (Tauri 2).
//!
//! Modules are placeholders only — no decoding/timeline/export logic yet.

use tauri::Manager;

pub mod audio;
pub mod commands;
pub mod decoder;
pub mod gpu;
pub mod project;
pub mod proxy;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}! Video editor is ready.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            // Workaround for Tauri #10746 / wry #637 on Windows:
            // the webview does not receive focus after the window is shown,
            // so the first click is consumed by the OS to activate the window.
            // We create the window hidden (see tauri.conf.json "visible": false),
            // then explicitly show + focus it and perform a "fake resize"
            // (+1px, wait 100ms, restore) to force Windows to recompute the
            // input region and hand focus over to the webview.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();

                let size = window.outer_size().ok();
                let scale = window.scale_factor().unwrap_or(1.0);
                if let Some(size) = size {
                    let delta = (scale * 1.0).max(1.0) as u32;
                    let enlarged = tauri::PhysicalSize::new(size.width + delta, size.height + delta);
                    let _ = window.set_size(enlarged);
                    let win = window.clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(100));
                        let _ = win.set_size(size);
                        let _ = win.set_focus();
                    });
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
