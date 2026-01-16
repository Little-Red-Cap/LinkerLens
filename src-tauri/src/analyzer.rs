use serde::{Deserialize, Serialize};
use std::fs;
use std::process::Command;

use crate::toolchain::{resolve_toolchain, ToolchainConfig, ToolchainPaths};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzeParams {
    pub elf_path: String,
    pub map_path: Option<String>,
    pub toolchain: Option<ToolchainConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub meta: AnalysisMeta,
    pub summary: AnalysisSummary,
    pub sections: Vec<SectionInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisMeta {
    pub elf_path: String,
    pub map_path: Option<String>,
    pub toolchain: ToolchainPaths,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisSummary {
    pub sections_totals: SectionTotals,
    pub top_symbols: Vec<SymbolInfo>,
    pub top_objects: Vec<ObjectContribution>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SectionTotals {
    pub flash_bytes: u64,
    pub ram_bytes: u64,
    pub text_bytes: u64,
    pub rodata_bytes: u64,
    pub data_bytes: u64,
    pub bss_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SectionInfo {
    pub name: String,
    pub size: u64,
    pub vma: Option<String>,
    pub lma: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SymbolInfo {
    pub name: String,
    pub size: u64,
    pub addr: Option<String>,
    pub kind: String,
    pub section_guess: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObjectContribution {
    pub name: String,
    pub size: u64,
}

#[tauri::command]
pub fn analyze_firmware(params: AnalyzeParams) -> Result<AnalysisResult, String> {
    validate_inputs(&params)?;
    let toolchain_paths = resolve_toolchain(params.toolchain.as_ref())?;

    let objdump_out = run_command(&toolchain_paths.objdump_path, &["-h", &params.elf_path])?;
    let sections = parse_objdump_sections(&objdump_out);

    let nm_out = run_command(
        &toolchain_paths.nm_path,
        &["-S", "--size-sort", &params.elf_path],
    )?;
    let mut symbols = parse_nm_symbols(&nm_out);
    symbols.sort_by(|a, b| b.size.cmp(&a.size));
    symbols.truncate(50);

    let totals = compute_section_totals(&sections);
    let top_objects = if let Some(map_path) = params.map_path.as_ref() {
        parse_map_objects(map_path)?
    } else {
        Vec::new()
    };

    Ok(AnalysisResult {
        meta: AnalysisMeta {
            elf_path: params.elf_path,
            map_path: params.map_path,
            toolchain: toolchain_paths,
        },
        summary: AnalysisSummary {
            sections_totals: totals,
            top_symbols: symbols,
            top_objects,
        },
        sections,
    })
}

fn validate_inputs(params: &AnalyzeParams) -> Result<(), String> {
    if params.elf_path.trim().is_empty() {
        return Err("ELF path is required.".to_string());
    }
    let elf_path = params.elf_path.trim();
    let metadata = fs::metadata(elf_path)
        .map_err(|e| format!("Failed to read ELF file {}: {}", elf_path, e))?;
    if !metadata.is_file() {
        return Err("ELF path must point to a file.".to_string());
    }
    if let Some(map_path) = params.map_path.as_ref() {
        let map_path = map_path.trim();
        if !map_path.is_empty() {
            let metadata = fs::metadata(map_path)
                .map_err(|e| format!("Failed to read MAP file {}: {}", map_path, e))?;
            if !metadata.is_file() {
                return Err("MAP path must point to a file.".to_string());
            }
        }
    }
    Ok(())
}

fn run_command(program: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new(program)
        .args(args)
        .output()
        .map_err(|e| format!("Failed to run {}: {}", program, e))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("{} failed: {}", program, stderr.trim()));
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

fn parse_objdump_sections(output: &str) -> Vec<SectionInfo> {
    output
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() || !trimmed.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false) {
                return None;
            }
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if parts.len() < 4 {
                return None;
            }
            let name = parts.get(1)?.to_string();
            let size = u64::from_str_radix(parts.get(2)?, 16).ok()?;
            let vma = parts.get(3).map(|v| v.to_string());
            let lma = parts.get(4).map(|v| v.to_string());
            Some(SectionInfo { name, size, vma, lma })
        })
        .collect()
}

fn parse_nm_symbols(output: &str) -> Vec<SymbolInfo> {
    let mut symbols = Vec::new();
    for line in output.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() < 4 {
            continue;
        }
        let addr = parts.get(0).map(|v| v.to_string());
        let size_hex = parts.get(1).unwrap_or(&"");
        let size = u64::from_str_radix(size_hex, 16).unwrap_or(0);
        if size == 0 {
            continue;
        }
        let kind = parts.get(2).unwrap_or(&"?").to_string();
        let name = parts[3..].join(" ");
        let section_guess = guess_section(&kind);
        symbols.push(SymbolInfo {
            name,
            size,
            addr,
            kind,
            section_guess,
        });
    }
    symbols
}

fn compute_section_totals(sections: &[SectionInfo]) -> SectionTotals {
    let mut totals = SectionTotals::default();
    for section in sections {
        match section.name.as_str() {
            ".text" => totals.text_bytes += section.size,
            ".rodata" => totals.rodata_bytes += section.size,
            ".data" => totals.data_bytes += section.size,
            ".bss" => totals.bss_bytes += section.size,
            _ => {}
        }
    }
    totals.flash_bytes = totals.text_bytes + totals.rodata_bytes + totals.data_bytes;
    totals.ram_bytes = totals.data_bytes + totals.bss_bytes;
    totals
}

fn guess_section(kind: &str) -> String {
    match kind {
        "T" | "t" => "text",
        "R" | "r" => "rodata",
        "D" | "d" | "G" | "g" | "S" | "s" => "data",
        "B" | "b" => "bss",
        _ => "other",
    }
    .to_string()
}

fn parse_map_objects(map_path: &str) -> Result<Vec<ObjectContribution>, String> {
    let contents =
        fs::read_to_string(map_path).map_err(|e| format!("Failed to read MAP file {}: {}", map_path, e))?;
    let mut totals: std::collections::HashMap<String, u64> = std::collections::HashMap::new();

    for line in contents.lines() {
        let trimmed = line.trim_start();
        if trimmed.starts_with(".") {
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if parts.len() < 4 {
                continue;
            }
            let size_hex = parts.get(2).unwrap_or(&"");
            let size = u64::from_str_radix(size_hex.trim_start_matches("0x"), 16).unwrap_or(0);
            if size == 0 {
                continue;
            }
            let file = parts.last().unwrap_or(&"");
            if file.starts_with('*') || file == &"*fill*" || file == &"*(COMMON)" {
                continue;
            }
            if !file.contains(".o") && !file.contains(".a") {
                continue;
            }
            let entry = totals.entry((*file).to_string()).or_insert(0);
            *entry += size;
        }
    }

    let mut result: Vec<ObjectContribution> = totals
        .into_iter()
        .map(|(name, size)| ObjectContribution { name, size })
        .collect();
    result.sort_by(|a, b| b.size.cmp(&a.size));
    if result.len() > 20 {
        result.truncate(20);
    }
    Ok(result)
}
