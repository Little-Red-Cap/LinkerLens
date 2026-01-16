use serde::{Deserialize, Serialize};
use std::env;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolchainConfig {
    pub auto_detect: bool,
    pub toolchain_root: Option<String>,
    pub nm_path: Option<String>,
    pub objdump_path: Option<String>,
    pub strings_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolchainPaths {
    pub nm_path: String,
    pub objdump_path: String,
    pub strings_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolchainCandidate {
    pub source: String,
    pub paths: ToolchainPaths,
}

#[tauri::command]
pub fn detect_toolchain(config: Option<ToolchainConfig>) -> Result<Vec<ToolchainCandidate>, String> {
    let mut results = Vec::new();

    if let Some(cfg) = config {
        if let Some(paths) = resolve_from_config(&cfg)? {
            results.push(ToolchainCandidate {
                source: "config".to_string(),
                paths,
            });
            return Ok(results);
        }
    }

    if let Some(paths) = resolve_from_path()? {
        results.push(ToolchainCandidate {
            source: "path".to_string(),
            paths,
        });
    }

    Ok(results)
}

pub fn resolve_toolchain(config: Option<&ToolchainConfig>) -> Result<ToolchainPaths, String> {
    if let Some(cfg) = config {
        if let Some(paths) = resolve_from_config(cfg)? {
            return Ok(paths);
        }
        if !cfg.auto_detect {
            return Err("Toolchain paths are not configured.".to_string());
        }
    }

    resolve_from_path()?
        .ok_or_else(|| "Failed to detect arm-none-eabi toolchain on PATH.".to_string())
}

fn resolve_from_config(config: &ToolchainConfig) -> Result<Option<ToolchainPaths>, String> {
    let nm = resolve_specific_path("arm-none-eabi-nm", config.nm_path.as_deref(), config.toolchain_root.as_deref())?;
    let objdump =
        resolve_specific_path("arm-none-eabi-objdump", config.objdump_path.as_deref(), config.toolchain_root.as_deref())?;
    let strings =
        resolve_specific_path("arm-none-eabi-strings", config.strings_path.as_deref(), config.toolchain_root.as_deref())?;

    if nm.is_some() && objdump.is_some() && strings.is_some() {
        return Ok(Some(ToolchainPaths {
            nm_path: nm.unwrap(),
            objdump_path: objdump.unwrap(),
            strings_path: strings.unwrap(),
        }));
    }

    Ok(None)
}

fn resolve_specific_path(
    tool: &str,
    explicit: Option<&str>,
    root: Option<&str>,
) -> Result<Option<String>, String> {
    if let Some(path) = explicit {
        if path_exists(path) {
            return Ok(Some(path.to_string()));
        }
        return Err(format!("Toolchain path not found: {}", path));
    }

    if let Some(root) = root {
        let candidate = guess_from_root(root, tool);
        if path_exists(&candidate) {
            return Ok(Some(candidate));
        }
    }

    Ok(None)
}

fn resolve_from_path() -> Result<Option<ToolchainPaths>, String> {
    let nm = find_in_path("arm-none-eabi-nm");
    let objdump = find_in_path("arm-none-eabi-objdump");
    let strings = find_in_path("arm-none-eabi-strings");

    if let (Some(nm_path), Some(objdump_path), Some(strings_path)) = (nm, objdump, strings) {
        Ok(Some(ToolchainPaths {
            nm_path,
            objdump_path,
            strings_path,
        }))
    } else {
        Ok(None)
    }
}

fn guess_from_root(root: &str, tool: &str) -> String {
    let suffix = if cfg!(windows) { ".exe" } else { "" };
    let mut base = PathBuf::from(root);
    if base.file_name().map(|name| name.to_string_lossy().to_lowercase()) != Some("bin".to_string()) {
        base.push("bin");
    }
    base.push(format!("{}{}", tool, suffix));
    base.to_string_lossy().to_string()
}

fn find_in_path(tool: &str) -> Option<String> {
    let suffix = if cfg!(windows) { ".exe" } else { "" };
    let target = format!("{}{}", tool, suffix);
    let path_var = env::var_os("PATH")?;
    for entry in env::split_paths(&path_var) {
        let candidate = entry.join(&target);
        if candidate.exists() {
            return Some(candidate.to_string_lossy().to_string());
        }
    }
    None
}

fn path_exists(path: &str) -> bool {
    Path::new(path).exists()
}
