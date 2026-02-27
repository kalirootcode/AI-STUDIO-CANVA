#!/usr/bin/env python3
"""
Re-inject updated EBOOK_STYLES and auto-fit into all ebook templates.
Reads from ebook-styles.js (source of truth) and updates each ebook-XX.js.
"""
import os
import re
import glob

BASE = os.path.dirname(__file__)
EBOOK_DIR = os.path.join(BASE, 'src', 'packs', 'ebook-pack')

def read_source_styles():
    """Read EBOOK_STYLES from ebook-styles.js"""
    path = os.path.join(EBOOK_DIR, 'ebook-styles.js')
    with open(path, 'r') as f:
        content = f.read()
    # Extract the template literal content between backticks
    match = re.search(r'export const EBOOK_STYLES = `(.*?)`;', content, re.DOTALL)
    if match:
        return match.group(1)
    return None

def process_template(filepath, new_styles):
    """Update EBOOK_STYLES in a single template file."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    basename = os.path.basename(filepath)
    modified = False
    
    # 1. Replace the EBOOK_STYLES content
    # Find the existing EBOOK_STYLES between backticks
    pattern = r"(const EBOOK_STYLES = `)(.*?)(`;)"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        old_styles = match.group(2)
        if old_styles.strip() != new_styles.strip():
            content = content[:match.start(2)] + new_styles + content[match.end(2):]
            modified = True
            print(f"  [+] Updated EBOOK_STYLES CSS")
    
    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✅ {basename} updated!")
    else:
        print(f"  ⏭️  {basename} already up to date")

def main():
    print("=" * 60)
    print("EBOOK STYLES RE-INJECTOR")
    print("=" * 60)
    
    new_styles = read_source_styles()
    if not new_styles:
        print("❌ Could not read EBOOK_STYLES from ebook-styles.js")
        return
    
    print(f"✅ Read {len(new_styles)} chars of updated styles\n")
    
    files = sorted(glob.glob(os.path.join(EBOOK_DIR, 'ebook-0*.js')))
    for f in files:
        print(f"\nProcessing: {os.path.basename(f)}")
        process_template(f, new_styles)
    
    print("\n" + "=" * 60)
    print("DONE!")
    print("=" * 60)

if __name__ == '__main__':
    main()
