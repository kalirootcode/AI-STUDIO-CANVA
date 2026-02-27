#!/usr/bin/env python3
"""
Re-inject getEbookAutoFitScript into all ebook templates.
Reads from ebook-brand.js and updates each ebook-XX.js.
"""
import os
import re
import glob

BASE = os.path.dirname(__file__)
EBOOK_DIR = os.path.join(BASE, 'src', 'packs', 'ebook-pack')

def read_source_autofit():
    """Read getEbookAutoFitScript from ebook-brand.js"""
    path = os.path.join(EBOOK_DIR, 'ebook-brand.js')
    with open(path, 'r') as f:
        content = f.read()
    
    # Extract function block
    pattern = r"(export function getEbookAutoFitScript\(\).*?)(?=\n\n|\n[a-z]+ function|\Z)"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        func_content = match.group(1).strip()
        # Remove 'export ' from the beginning for injection
        if func_content.startswith('export '):
            func_content = func_content[7:]
        return func_content
    return None

def process_template(filepath, new_func):
    """Update getEbookAutoFitScript in a single template file."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    basename = os.path.basename(filepath)
    modified = False
    
    # Find existing getEbookAutoFitScript function
    pattern = r"(function getEbookAutoFitScript\(\).*?)(?=\n// --- END)"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        old_func = match.group(1).strip()
        if old_func != new_func:
            content = content[:match.start(1)] + new_func + '\n' + content[match.end(1):]
            modified = True
            print(f"  [+] Updated getEbookAutoFitScript")
    
    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✅ {basename} updated!")
    else:
        print(f"  ⏭️  {basename} already up to date")

def main():
    print("=" * 60)
    print("AUTOFIT RE-INJECTOR")
    print("=" * 60)
    
    new_func = read_source_autofit()
    if not new_func:
        print("❌ Could not read getEbookAutoFitScript from ebook-brand.js")
        return
    
    print(f"✅ Read updated function\n")
    
    files = sorted(glob.glob(os.path.join(EBOOK_DIR, 'ebook-0*.js')))
    for f in files:
        print(f"\nProcessing: {os.path.basename(f)}")
        process_template(f, new_func)
    
    print("\n" + "=" * 60)
    print("DONE!")
    print("=" * 60)

if __name__ == '__main__':
    main()
