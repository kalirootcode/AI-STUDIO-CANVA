
import os
import re

# Path to templates
TEMPLATE_DIR = '/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack'

def adjust_typography(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Bump Font Sizes
    # We use a callback to selectively increment
    def replace_font_size(match):
        val = int(match.group(1))
        
        # Don't touch extremely small or large values unless specific
        if val < 10: return match.group(0) # Likely not font size or tiny
        
        new_val = val
        if 10 <= val <= 14:
            new_val = val + 2 # 12->14, 14->16
        elif 15 <= val <= 24:
            new_val = val + 2 # 16->18, 20->22
        elif 25 <= val <= 40:
            new_val = val + 4 # 30->34
        
        # Leave Titles (48px+) alone or slight bump? 
        # User said "letras mas grandes". Titles are likely fine.
        
        return f"font-size: {new_val}px"

    # Regex: font-size: Xpx
    content = re.sub(r'font-size:\s*(\d+)px', replace_font_size, content)
    
    # 2. Fix Terminal Overflow
    # Add white-space: pre-wrap to terminal classes
    # Look for .term-body { ... } or .term-output { ... }
    # And inject the rule if not present
    
    term_classes = ['term-body', 'term-output', 'cmd-body', 'code-line']
    for cls in term_classes:
        # Regex to find .class { content }
        # This is tricky with simple regex.
        # We'll just look for the string and assume standard formatting
        cls_pattern = re.compile(rf'\.{cls}\s*\{{([^}}]+)\}}')
        
        def add_wrap(match):
            body = match.group(1)
            if 'white-space' not in body:
                return f".{cls} {{{body} white-space: pre-wrap; word-break: break-word; }}"
            return match.group(0)
            
        content = cls_pattern.sub(add_wrap, content)

    # 3. Check for Centering request?
    # User said "haz que el templete que crea esta imagen cree el contenido centrado"
    # This might be specific. We'll stick to typography here.

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Adjusted typography in {os.path.basename(filepath)}")
    else:
        print(f"No changes in {os.path.basename(filepath)}")

# Targeted files: 01 to 31
for i in range(1, 32):
    fname = f"kr-clidn-{i:02d}.js"
    fpath = os.path.join(TEMPLATE_DIR, fname)
    if os.path.exists(fpath):
        adjust_typography(fpath)
    else:
        print(f"Skipping {fname} (not found)")

print("Batch Typography Adjustment Complete.")
