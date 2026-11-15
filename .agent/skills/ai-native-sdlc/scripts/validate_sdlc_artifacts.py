#!/usr/bin/env python3
"""
AI-Native SDLC Artifact Validator
Validates markdown artifacts (intent.md, spec.md, plan.md, REVIEW.md, bands.yaml)
against the operational standards defined in Anthropic's AI-Native SDLC Playbook.
"""

import sys
import os
import re
import argparse
from pathlib import Path
from typing import List, Tuple, Dict, Any

class ValidationError:
    def __init__(self, file_path: str, message: str, is_critical: bool = True):
        self.file_path = file_path
        self.message = message
        self.is_critical = is_critical

    def __str__(self) -> str:
        prefix = "CRITICAL" if self.is_critical else "WARNING"
        return f"[{prefix}] {self.file_path}: {self.message}"

def check_file_exists(file_path: Path) -> bool:
    return file_path.is_file() and file_path.stat().st_size > 0

def validate_intent_file(file_path: Path) -> List[ValidationError]:
    errors = []
    content = file_path.read_text(encoding="utf-8")
    
    required_sections = [
        (r"(?i)#\s+intent", "Missing top-level header '# Intent: <Title>'"),
        (r"(?i)##\s+.*problem", "Missing '## Problem' section"),
        (r"(?i)##\s+.*(proposed outcome|outcome)", "Missing '## Proposed Outcome' section"),
        (r"(?i)##\s+.*(affected users|systems)", "Missing '## Affected Users and Systems' section"),
        (r"(?i)##\s+.*constraints", "Missing '## Constraints' section"),
    ]
    
    for pattern, msg in required_sections:
        if not re.search(pattern, content):
            errors.append(ValidationError(str(file_path), msg, is_critical=True))
            
    # Check for status
    if not re.search(r"(?i)status:\s*(draft|accepted|rejected)", content):
        errors.append(ValidationError(str(file_path), "Missing or invalid 'Status: draft | accepted | rejected'", is_critical=False))
        
    return errors

def validate_spec_file(file_path: Path) -> List[ValidationError]:
    errors = []
    content = file_path.read_text(encoding="utf-8")
    
    required_sections = [
        (r"(?i)#\s+.*spec", "Missing top-level header '# Technical Specification / Spec'"),
        (r"(?i)##\s+.*(overview|architecture|decisions)", "Missing Architectural Overview / Decisions section"),
        (r"(?i)##\s+.*(requirements|technical requirements)", "Missing Technical Requirements section"),
        (r"(?i)##\s+.*(security|compliance)", "Missing Security / Compliance section"),
    ]
    
    for pattern, msg in required_sections:
        if not re.search(pattern, content):
            errors.append(ValidationError(str(file_path), msg, is_critical=True))
            
    # Check for areas of concern / flagged issues
    if not re.search(r"(?i)(areas of concern|flagged concern|conflicts)", content):
        errors.append(ValidationError(str(file_path), "Recommended: Include 'Areas of Concern' to document flagged policy conflicts.", is_critical=False))
        
    return errors

def validate_plan_file(file_path: Path) -> List[ValidationError]:
    errors = []
    content = file_path.read_text(encoding="utf-8")
    
    required_sections = [
        (r"(?i)#\s+plan", "Missing top-level header '# Plan: <Feature>'"),
        (r"(?i)##\s+.*files.*change", "Missing '## Files That Change' section"),
        (r"(?i)##\s+.*order.*work", "Missing '## Order of Work' section"),
        (r"(?i)##\s+.*(risks|blast radius)", "Missing '## Risks / Blast Radius' section"),
        (r"(?i)##\s+.*proof", "Missing '## Proof / Proof of Correctness' section"),
    ]
    
    for pattern, msg in required_sections:
        if not re.search(pattern, content):
            errors.append(ValidationError(str(file_path), msg, is_critical=True))
            
    return errors

def validate_review_guidelines(file_path: Path) -> List[ValidationError]:
    errors = []
    content = file_path.read_text(encoding="utf-8")
    
    required_passes = [
        (r"(?i)(bugs|logic)", "Missing Pass for Logic & Bug detection"),
        (r"(?i)(security|privacy)", "Missing Pass for Security & Privacy"),
        (r"(?i)(compliance|spec)", "Missing Pass for Spec & Plan compliance"),
    ]
    
    for pattern, msg in required_passes:
        if not re.search(pattern, content):
            errors.append(ValidationError(str(file_path), msg, is_critical=True))
            
    if not re.search(r"(?i)(nit|cap)", content):
        errors.append(ValidationError(str(file_path), "Missing guidance on Nit thresholds / Nit capping", is_critical=False))
        
    return errors

def scan_directory(target_dir: Path) -> List[ValidationError]:
    all_errors = []
    
    for root, _, files in os.walk(target_dir):
        # Skip node_modules, .git, venv
        if any(ignored in root for ignored in [".git", "node_modules", ".venv", "__pycache__"]):
            continue
            
        for file in files:
            path = Path(root) / file
            lower_name = file.lower()
            
            if lower_name.endswith("intent.md") or "intent" in lower_name and lower_name.endswith(".md"):
                all_errors.extend(validate_intent_file(path))
            elif lower_name.endswith("spec.md") or "spec" in lower_name and lower_name.endswith(".md"):
                all_errors.extend(validate_spec_file(path))
            elif lower_name == "plan.md" or lower_name.endswith("-plan.md"):
                all_errors.extend(validate_plan_file(path))
            elif lower_name == "review.md":
                all_errors.extend(validate_review_guidelines(path))
                
    return all_errors

def main():
    parser = argparse.ArgumentParser(description="AI-Native SDLC Artifact Linter & Validator")
    parser.add_argument("paths", nargs="*", default=["."], help="Directories or files to validate")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors")
    
    args = parser.parse_args()
    
    total_errors: List[ValidationError] = []
    
    for target in args.paths:
        target_path = Path(target)
        if not target_path.exists():
            print(f"Path not found: {target}", file=sys.stderr)
            continue
            
        if target_path.is_file():
            lower = target_path.name.lower()
            if "intent" in lower and lower.endswith(".md"):
                total_errors.extend(validate_intent_file(target_path))
            elif "spec" in lower and lower.endswith(".md"):
                total_errors.extend(validate_spec_file(target_path))
            elif "plan" in lower and lower.endswith(".md"):
                total_errors.extend(validate_plan_file(target_path))
            elif lower == "review.md":
                total_errors.extend(validate_review_guidelines(target_path))
        else:
            total_errors.extend(scan_directory(target_path))
            
    criticals = [e for e in total_errors if e.is_critical]
    warnings = [e for e in total_errors if not e.is_critical]
    
    print("\n=== AI-Native SDLC Artifact Validation Summary ===")
    print(f"Total files checked across targets: {len(args.paths)}")
    print(f"Critical violations: {len(criticals)}")
    print(f"Advisory warnings:   {len(warnings)}\n")
    
    for err in total_errors:
        print(err)
        
    if criticals or (args.strict and warnings):
        print("\n❌ Validation FAILED.")
        sys.exit(1)
    else:
        print("\n✅ All checked artifacts conform to the AI-Native SDLC operational standard.")
        sys.exit(0)

if __name__ == "__main__":
    main()
