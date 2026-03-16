use serde::Serialize;
use std::sync::Mutex;
use sysinfo::System;

const BYTES_PER_GB: f64 = 1_073_741_824.0;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SystemStats {
    pub cpu_usage: f32,
    pub memory_usage: f32,
    #[serde(rename = "memoryUsedGB")]
    pub memory_used_gb: f32,
    #[serde(rename = "memoryTotalGB")]
    pub memory_total_gb: f32,
}

pub struct SystemMonitor {
    sys: Mutex<System>,
}

impl SystemMonitor {
    pub fn new() -> Self {
        let mut sys = System::new();
        sys.refresh_cpu_usage();
        sys.refresh_memory();
        Self {
            sys: Mutex::new(sys),
        }
    }

    pub fn get_stats(&self) -> Result<SystemStats, String> {
        let mut sys = self
            .sys
            .lock()
            .map_err(|e| format!("System monitor lock poisoned: {e}"))?;
        sys.refresh_cpu_usage();
        sys.refresh_memory();

        let cpu_usage = sys.global_cpu_usage();
        let total_memory = sys.total_memory() as f64;
        let used_memory = sys.used_memory() as f64;

        Ok(SystemStats {
            cpu_usage: (cpu_usage * 10.0).round() / 10.0,
            memory_usage: if total_memory > 0.0 {
                ((used_memory / total_memory * 1000.0).round() / 10.0) as f32
            } else {
                0.0
            },
            memory_used_gb: ((used_memory / BYTES_PER_GB * 10.0).round() / 10.0) as f32,
            memory_total_gb: ((total_memory / BYTES_PER_GB * 10.0).round() / 10.0) as f32,
        })
    }
}

#[tauri::command]
pub fn get_system_stats(monitor: tauri::State<'_, SystemMonitor>) -> Result<SystemStats, String> {
    monitor.get_stats()
}
