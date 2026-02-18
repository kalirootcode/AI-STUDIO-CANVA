import os
import re

directory = '/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack'

# Greys to replace with White (#ffffff) or very bright grey (#f0f0f0)
# We'll use #e0e0e0 to keep slight hierarchy from pure #ffffff headers, or just #ffffff.
# User said "blanco". Let's go with #e0e0e0 for body text to avoid eye strain, or #ffffff if they insist.
# "cambialos a blaco" -> #ffffff.

replacements = {
    '#94a3b8': '#ffffff', # Slate 400
    '#64748b': '#ffffff', # Slate 500
    '#475569': '#ffffff', # Slate 600
    '#888': '#ffffff',
    '#888888': '#ffffff',
    '#666': '#ffffff',
    '#666666': '#ffffff',
    '#aaa': '#ffffff',
    '#aaaaaa': '#ffffff',
    '#555': '#ffffff',
    '#555555': '#ffffff',
    '#777': '#ffffff', 
    'color: #888': 'color: #ffffff',
}

count = 0

for filename in os.listdir(directory):
    if filename.endswith(".js"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        new_content = content
        
        # Simple string replacements for now
        for grey, white in replacements.items():
            # Case insensitive for hex? simplified.
            new_content = new_content.replace(grey, white)
            new_content = new_content.replace(grey.upper(), white)
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Whitewashed {filename}")
            count += 1

print(f"Total files updated: {count}")
