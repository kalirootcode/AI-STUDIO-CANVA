
import os
import re
import glob

# Path to templates
TEMPLATE_DIR = '/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack'

def process_file(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_len = len(content)
    
    # 1. REMOVE .content CSS BLOCK
    # Regex for .content { ... } (multiline, greedy until closing brace)
    # We rely on indentation or logic. A simple regex:
    # .content\s*\{[^}]*\}
    content = re.sub(r'\.content\s*\{[^}]*\}', '', content)
    
    # 2. FIX PREMATURE SAFE-ZONE CLOSE
    # <div class="safe-zone">\s*<div class="brand-line"></div>\s*</div>
    # Remove the last </div>
    premature_pattern = r'(<div class="safe-zone">\s*<div class="brand-line"></div>)\s*</div>'
    if re.search(premature_pattern, content):
        content = re.sub(premature_pattern, r'\1', content)
        print("  Fixed premature safe-zone close")
    
    # 3. REMOVE <div class="content">
    if '<div class="content">' in content:
        content = content.replace('<div class="content">', '')
        print("  Removed <div class=\"content\">")
        
    # 4. REMOVE CLOSING </div> BEFORE SWIPE ARROWS
    # We look for </div> followed by <div class="swipe-arrows">
    # This </div> was closing .content (or safe-zone in broken structure)
    # We want to remove it to flatten the structure.
    swipe_pattern = r'</div>(\s*<div class="swipe-arrows">)'
    if re.search(swipe_pattern, content):
        # We only remove ONE closing div. If there are multiple, we might need to be careful?
        # But generally, just removing the immediate predecessor is correct for flattening.
        content = re.sub(swipe_pattern, r'\1', content, count=1)
        print("  Removed closing </div> before swipe-arrows")
        
    # 5. ENSURE SAFE-ZONE HAS SPACE-BETWEEN
    # Find .safe-zone { ... } and check justification
    # We want to ensure it has justify-content: space-between
    # And maybe display: flex; flex-direction: column;
    # Let's just replace the whole block if possible, or edit it safely.
    # Regex for safe-zone block:
    sz_match = re.search(r'\.safe-zone\s*\{([^}]*)\}', content)
    if sz_match:
        css_body = sz_match.group(1)
        if 'justify-content: space-between' not in css_body:
            # Replace/Add it
            if 'justify-content:' in css_body:
                new_body = re.sub(r'justify-content:\s*[^;]+;', 'justify-content: space-between;', css_body)
            else:
                new_body = css_body + ' justify-content: space-between;'
            
            # Apply update
            content = content.replace(css_body, new_body)
            print("  Updated safe-zone CSS to space-between")

    if len(content) != original_len:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("  Saved changes.")
    else:
        print("  No changes needed.")

# Targeted files: 02 to 31
for i in range(2, 32):
    fname = f"kr-clidn-{i:02d}.js"
    fpath = os.path.join(TEMPLATE_DIR, fname)
    if os.path.exists(fpath):
        process_file(fpath)
    else:
        print(f"Skipping {fname} (not found)")

print("Batch Fix Complete.")
