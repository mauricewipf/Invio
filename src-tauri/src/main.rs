use std::sync::Mutex;

use tauri::{Manager, RunEvent, WindowEvent};
use tauri_plugin_shell::{process::CommandChild, ShellExt};

struct BackendSidecar {
    child: Mutex<Option<CommandChild>>,
}

impl BackendSidecar {
    fn new(child: CommandChild) -> Self {
        Self {
            child: Mutex::new(Some(child)),
        }
    }

    fn kill(&self) {
        match self.child.lock() {
            Ok(mut child) => {
                if let Some(child) = child.take() {
                    if let Err(error) = child.kill() {
                        eprintln!("failed to kill backend sidecar: {error}");
                    }
                }
            }
            Err(error) => {
                eprintln!("failed to lock backend sidecar for cleanup: {error}");
            }
        }
    }
}

fn start_backend_sidecar<R: tauri::Runtime>(app: &mut tauri::App<R>) {
    let data_dir = match app.path().app_data_dir() {
        Ok(path) => path,
        Err(error) => {
            eprintln!("failed to resolve app data directory for backend sidecar: {error}");
            return;
        }
    };

    if let Err(error) = std::fs::create_dir_all(&data_dir) {
        eprintln!(
            "failed to create backend sidecar data directory {}: {error}",
            data_dir.display()
        );
        return;
    }

    let sidecar = match app.shell().sidecar("backend") {
        Ok(command) => command,
        Err(error) => {
            eprintln!("failed to resolve backend sidecar binary: {error}");
            return;
        }
    };

    let (mut rx, child) = match sidecar.env("INVIO_DATA_DIR", data_dir).spawn() {
        Ok(process) => process,
        Err(error) => {
            eprintln!("failed to spawn backend sidecar: {error}");
            return;
        }
    };

    app.manage(BackendSidecar::new(child));

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            println!("backend sidecar event: {event:?}");
        }
    });
}

fn main() {
    let app = match tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            start_backend_sidecar(app);
            Ok(())
        })
        .on_window_event(|window, event| {
            if matches!(event, WindowEvent::Destroyed) {
                if let Some(sidecar) = window.try_state::<BackendSidecar>() {
                    sidecar.kill();
                }
            }
        })
        .build(tauri::generate_context!())
    {
        Ok(app) => app,
        Err(error) => {
            eprintln!("failed to build Tauri application: {error}");
            return;
        }
    };

    app.run(|app, event| {
        if matches!(event, RunEvent::Exit) {
            if let Some(sidecar) = app.try_state::<BackendSidecar>() {
                sidecar.kill();
            }
        }
    });
}
