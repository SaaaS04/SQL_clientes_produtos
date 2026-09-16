use std::process::{Child, Command};
use std::sync::Mutex;

use tauri::{Manager, RunEvent};

/// Processo do motor de calculo (FastAPI). Guardado para ser encerrado com o app.
struct Motor(Mutex<Option<Child>>);

fn comando_motor() -> Command {
    if cfg!(debug_assertions) {
        // desenvolvimento (`tauri dev`): Python do sistema, com doe_api instalado
        let mut c = Command::new("python");
        c.args(["-m", "doe_api"]);
        c
    } else {
        // app instalado: executavel do PyInstaller, que o instalador poe ao lado do app
        let exe = std::env::current_exe().expect("caminho do executavel");
        let pasta = exe.parent().expect("pasta do executavel");
        let nome = if cfg!(windows) { "doe-api.exe" } else { "doe-api" };
        Command::new(pasta.join(nome))
    }
}

fn iniciar_motor() -> Option<Child> {
    let mut cmd = comando_motor();
    cmd.env("DOE_API_PORT", "8765");
    // o servidor vigia este PID e sai sozinho se o app fechar ou cair
    cmd.env("DOE_PARENT_PID", std::process::id().to_string());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    match cmd.spawn() {
        Ok(child) => Some(child),
        Err(e) => {
            log::error!("nao foi possivel iniciar o motor de calculo: {e}");
            None
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        // seletor nativo de pasta de trabalho
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            app.manage(Motor(Mutex::new(iniciar_motor())));
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("erro ao montar o app Tauri");

    app.run(|handle, event| {
        if let RunEvent::Exit = event {
            if let Some(motor) = handle.try_state::<Motor>() {
                if let Some(mut child) = motor.0.lock().unwrap().take() {
                    let _ = child.kill();
                }
            }
        }
    });
}
