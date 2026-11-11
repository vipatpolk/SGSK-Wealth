#!/usr/bin/env python3
"""
validate_gherkin.py - Automated Gherkin & Cucumber Best Practices Linter

Validates .feature files against established BDD & Gherkin best practices:
  - Detects imperative UI scripting (button clicks, form inputs, waits)
  - Identifies conjunctive steps (compounding multiple actions into one step)
  - Flags trailing punctuation on steps (periods, commas)
  - Detects bloated backgrounds (> 4 steps, or containing When/Then)
  - Flags vague or missing scenario titles
  - Checks for proper tagging taxonomy and layer tags
"""

import sys
import os
import re
import argparse
from typing import List, Dict, Any, Optional

IMPERATIVE_PATTERNS = [
    (r'\bclick(s|ed|ing)? on (the |a )?(button|link|icon|tab|option|menu|dropdown)\b', 'Imperative UI click detected'),
    (r'\btype(s|d|ing)? (".*?"|into (the |an? )?input|into field)\b', 'Imperative text entry detected'),
    (r'\bpress(es|ed|ing)? (the |a )?(key|button|enter|tab)\b', 'Imperative keypress detected'),
    (r'\b(select|check|uncheck)(s|ed|ing)? (the |a )?(checkbox|radio button|dropdown)\b', 'Imperative form selection detected'),
    (r'\bwait(s|ed|ing)? for \d+ (second|ms|millisecond)s?\b', 'Explicit sleep/wait in step detected'),
    (r'\b(locate|find)(s|ed|ing)? element with (id|class|xpath|css)\b', 'Leaky locator details in Gherkin step'),
]

CONJUNCTIVE_PATTERN = re.compile(
    r'^(Given|When|Then|And|But)\s+(.+?\b(?:and|then)\s+(?:I|the user|a user|we)\s+(?:click|filter|select|enter|submit|verify|check|navigate|open|send|create|update|delete)\b.*)$',
    re.IGNORECASE
)

TRAILING_PUNCTUATION = re.compile(r'^(Given|When|Then|And|But)\s+.*?[.,;]\s*$')

STEP_KEYWORD_REGEX = re.compile(r'^\s*(Given|When|Then|And|But)\s+(.+)$')
FEATURE_KEYWORD_REGEX = re.compile(r'^\s*Feature:\s*(.+)$')
BACKGROUND_KEYWORD_REGEX = re.compile(r'^\s*Background:\s*$')
SCENARIO_KEYWORD_REGEX = re.compile(r'^\s*(Scenario|Scenario Outline):\s*(.+)?$')
TAG_REGEX = re.compile(r'^\s*(@[\w\-]+(\s+@[\w\-]+)*)\s*$')

VAGUE_TITLES = re.compile(r'^(test|test\s*\d+|scenario\s*\d+|check|check\s*button|verify\s*page|untitled)$', re.IGNORECASE)


class Issue:
    def __init__(self, file_path: str, line_no: int, code: str, message: str, severity: str = 'WARNING', line_text: str = ''):
        self.file_path = file_path
        self.line_no = line_no
        self.code = code
        self.message = message
        self.severity = severity
        self.line_text = line_text

    def __str__(self):
        return f"{self.file_path}:{self.line_no} [{self.severity}] ({self.code}): {self.message}\n  --> {self.line_text.strip()}"


def lint_feature_file(file_path: str) -> List[Issue]:
    issues: List[Issue] = []

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_background = False
    background_step_count = 0
    background_line_start = 0
    feature_found = False
    feature_tags: List[str] = []
    pending_tags: List[str] = []
    in_doc_string = False

    for i, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()

        # Handle doc strings (\"\"\" or ```)
        if line.startswith('"""') or line.startswith('```'):
            in_doc_string = not in_doc_string
            continue
        if in_doc_string:
            continue

        # Ignore comments or empty lines
        if not line or line.startswith('#'):
            continue

        # Tag lines
        tag_match = TAG_REGEX.match(line)
        if tag_match:
            tags = [t.strip() for t in line.split() if t.startswith('@')]
            pending_tags.extend(tags)
            continue

        # Feature line
        feat_match = FEATURE_KEYWORD_REGEX.match(line)
        if feat_match:
            feature_found = True
            feature_tags = list(pending_tags)
            pending_tags.clear()

            # Check if feature has layer tag (@ui or @api)
            has_layer_tag = any(t in ['@ui', '@api', '@e2e', '@integration'] for t in feature_tags)
            if not has_layer_tag:
                issues.append(Issue(
                    file_path, i, 'TAG-01',
                    'Feature missing layer tag (e.g. @ui, @api, @integration)',
                    'WARNING', raw_line
                ))
            continue

        # Background line
        bg_match = BACKGROUND_KEYWORD_REGEX.match(line)
        if bg_match:
            in_background = True
            background_step_count = 0
            background_line_start = i
            pending_tags.clear()
            continue

        # Scenario line
        scen_match = SCENARIO_KEYWORD_REGEX.match(line)
        if scen_match:
            if in_background:
                if background_step_count > 4:
                    issues.append(Issue(
                        file_path, background_line_start, 'BG-01',
                        f'Background has {background_step_count} steps; maximum recommended is 3-4',
                        'WARNING', f'Background (steps: {background_step_count})'
                    ))
                in_background = False

            scen_title = scen_match.group(2)
            if not scen_title or not scen_title.strip():
                issues.append(Issue(
                    file_path, i, 'SCEN-01',
                    'Scenario title is empty',
                    'ERROR', raw_line
                ))
            else:
                title_clean = scen_title.strip()
                if VAGUE_TITLES.match(title_clean):
                    issues.append(Issue(
                        file_path, i, 'SCEN-02',
                        f'Scenario title "{title_clean}" is too vague. Specify the business behavior/rule.',
                        'WARNING', raw_line
                    ))

            pending_tags.clear()
            continue

        # Step line
        step_match = STEP_KEYWORD_REGEX.match(line)
        if step_match:
            keyword = step_match.group(1)
            step_text = step_match.group(2)

            if in_background:
                background_step_count += 1
                if keyword in ['When', 'Then']:
                    issues.append(Issue(
                        file_path, i, 'BG-02',
                        f'Background contains an action/outcome step ({keyword}). Background should only establish Given preconditions.',
                        'ERROR', raw_line
                    ))

            # Check Trailing Punctuation
            if TRAILING_PUNCTUATION.match(line):
                # Allow ellipsis or json colons if intentional, but flag trailing periods or commas
                last_char = step_text.rstrip()[-1]
                if last_char in ['.', ',']:
                    issues.append(Issue(
                        file_path, i, 'STEP-01',
                        f'Step ends with trailing punctuation "{last_char}". Remove trailing punctuation from step definitions.',
                        'WARNING', raw_line
                    ))

            # Check Conjunctive Steps
            conj_match = CONJUNCTIVE_PATTERN.match(line)
            if conj_match:
                issues.append(Issue(
                    file_path, i, 'STEP-02',
                    'Conjunctive step detected (multiple actions combined with "and"/"then"). Split into separate steps.',
                    'WARNING', raw_line
                ))

            # Check Imperative UI Scripting
            for pattern, msg in IMPERATIVE_PATTERNS:
                if re.search(pattern, step_text, re.IGNORECASE):
                    issues.append(Issue(
                        file_path, i, 'STYLE-01',
                        f'{msg}. Prefer declarative business-intent statements.',
                        'WARNING', raw_line
                    ))
                    break

    # Final check on background if last item
    if in_background and background_step_count > 4:
        issues.append(Issue(
            file_path, background_line_start, 'BG-01',
            f'Background has {background_step_count} steps; maximum recommended is 3-4',
            'WARNING', f'Background (steps: {background_step_count})'
        ))

    return issues


def main():
    parser = argparse.ArgumentParser(
        description='Automated Gherkin & Cucumber Best Practices Linter'
    )
    parser.add_argument(
        'paths', nargs='+', help='Feature files or directories to scan'
    )
    parser.add_argument(
        '--strict', action='store_true', help='Treat warnings as errors (exit code 1 on warnings)'
    )

    args = parser.parse_args()

    target_files = []
    for path in args.paths:
        if os.path.isfile(path):
            if path.endswith('.feature'):
                target_files.append(path)
        elif os.path.isdir(path):
            for root, _, files in os.walk(path):
                for file in files:
                    if file.endswith('.feature'):
                        target_files.append(os.path.join(root, file))

    if not target_files:
        print("No .feature files found to inspect.")
        sys.exit(0)

    print(f"🔍 Scanning {len(target_files)} feature file(s) for Gherkin best practices...\n")

    total_issues: List[Issue] = []
    for f in target_files:
        file_issues = lint_feature_file(f)
        total_issues.extend(file_issues)

    if not total_issues:
        print("✅ 100% Compliant: All feature files satisfy Gherkin & BDD best practice standards!")
        sys.exit(0)

    errors = [iss for iss in total_issues if iss.severity == 'ERROR']
    warnings = [iss for iss in total_issues if iss.severity == 'WARNING']

    for iss in total_issues:
        print(iss)
        print()

    print(f"📊 Scan Summary: {len(errors)} error(s), {len(warnings)} warning(s) across {len(target_files)} file(s).")

    if errors or (args.strict and warnings):
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
