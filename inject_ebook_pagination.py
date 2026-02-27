#!/usr/bin/env python3
"""
Re-inject getEbookPagination into all ebook templates.
Reads from ebook-brand.js and updates each ebook-XX.js.
"""
import os
import re
import glob

BASE = os.path.dirname(__file__)
EBOOK_DIR = os.path.join(BASE, 'src', 'packs', 'ebook-pack')

def read_source_pagination():
    """Read getEbookPagination from ebook-brand.js"""
    path = os.path.join(EBOOK_DIR, 'ebook-brand.js')
    with open(path, 'r') as f:
        content = f.read()
    
    # Extract function block
    pattern = r"(function getEbookPagination.*?)(?=\n\n|\n[a-z]+ function|\Z)"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return None

def process_template(filepath, new_func):
    """Update getEbookPagination in a single template file."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    basename = os.path.basename(filepath)
    modified = False
    
    pattern = r"(function getEbookPagination.*?)(?=\nfunction getEbookAutoFit|\n// --- END)"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        old_func = match.group(1).strip()
        if old_func != new_func:
            content = content[:match.start(1)] + new_func + '\n' + content[match.end(1):]
            modified = True
            print(f"  [+] Updated getEbookPagination")
    
    if modified:
        # Also need to add padding-bottom to .safe-zone so content doesn't
        # overlap the new pagination which is at bottom: 40px
        # Find safe-zone padding and update it
        sz_pattern = r'(\.safe-zone\s*\{[^}]*?padding:\s*)40px 60px;'
        sz_match = re.search(sz_pattern, content)
        if sz_match:
            content = content[:sz_match.start(1)] + sz_match.group(1) + '40px 60px 100px 60px;' + content[sz_match.end():]
            print(f"  [+] Updated safe-zone padding")

        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✅ {basename} updated!")
    else:
        print(f"  ⏭️  {basename} already up to date")

def main():
    print("=" * 60)
    print("PAGINATION RE-INJECTOR")
    print("=" * 60)
    
    new_func = read_source_pagination()
    if not new_func:
        print("❌ Could not read getEbookPagination from ebook-brand.js")
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
