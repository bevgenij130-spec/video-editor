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
            // Strengthened workaround for Tauri #10746 / wry #637 on Windows:
            // the webview does not receive focus after the window is shown,
            // so the first click is consumed by the OS to activate the window.
            // Window is created hidden ("visible": false in tauri.conf.json),
            // then we show + focus it and run TWO passes of a "fake resize":
            //   pass 1 (after 150ms): enlarge by 16 logical px, then restore —
            //     forces Windows to recompute the input region;
            //   pass 2 (after 400ms): repeat set_focus — gives WebView2 time
            //     to finish initialization.
            // LogicalSize is used instead of PhysicalSize for HiDPI correctness.
            if let Some(window) = app.get_webview_window("main") {
                println!("[setup] webview window found, showing and focusing");
                let _ = window.show();
                let _ = window.set_focus();
                println!("[setup] window.show() + window.set_focus() called");

                let logical = window.outer_position().ok().and_then(|_| {
                    window.inner_size().ok().map(|size| {
                        let scale = window.scale_factor().unwrap_or(1.0);
                        tauri::LogicalSize::new(
                            f64::from(size.width) / f64::from(scale as f32),
                            f64::from(size.height) / f64::from(scale as f32),
                        )
                    })
                });
                if let Some(base) = logical {
                    let enlarged = tauri::LogicalSize::new(base.width + 16.0, base.height + 16.0);
                    println!("[setup] fake-resize pass 1 scheduled in 150ms (base={base:?}, enlarged={enlarged:?})");
                    let win = window.clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(150));
                        println!("[setup] pass 1: enlarging window by 16 logical px");
                        let _ = win.set_size(enlarged);
                        println!("[setup] pass 1: restoring original size");
                        let _ = win.set_size(base);
                        println!("[setup] pass 1 complete");
                    });
                    let win2 = window.clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(400));
                        println!("[setup] pass 2: repeating set_focus for WebView2 init");
                        let _ = win2.set_focus();
                        println!("[setup] pass 2 complete — setup finished");
                    });
                } else {
                    println!("[setup] WARNING: could not read window size, skipping fake-resize");
                }
            } else {
                println!("[setup] WARNING: main webview window not found");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
