
import os
import re

# Path to templates
TEMPLATE_DIR = '/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack'

def remove_arrows(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to find <div class="swipe-arrows">...</div>
    # It might vary slightly in content or whitespace.
    # We'll look for the div with that class.
    # <div class="swipe-arrows">[^<]*</div>
    pattern = r'\s*<div class="swipe-arrows">[^<]*</div>'
    
    if re.search(pattern, content):
        new_content = re.sub(pattern, '', content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Removed arrows from {os.path.basename(filepath)}")
    else:
        print(f"No arrows in {os.path.basename(filepath)}")

# Targeted files: 01 to 31
for i in range(1, 32):
    fname = f"kr-clidn-{i:02d}.js"
    fpath = os.path.join(TEMPLATE_DIR, fname)
    if os.path.exists(fpath):
        remove_arrows(fpath)
    else:
        print(f"Skipping {fname} (not found)")

print("Batch Removal Complete.")
