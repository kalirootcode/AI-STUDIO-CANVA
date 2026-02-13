import os
import re

PACKS_DIR = '/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack'

# Regex to find the Iconify span with the ternary logic we inserted
# Pattern: <span class="iconify" data-icon="${VAR.includes(':') ? VAR : 'material-symbols:' + VAR}"></span>
# We capture VAR as group 1.
REGEX_ICONIFY_SPAN = re.compile(r'<span class="iconify" data-icon="\$\{(.+?)\.includes\(\':\'\)\s*\?\s*(.+?)\s*:\s*\'material-symbols:\'\s*\+\s*(.+?)\}"></span>')

# Regex to check if Material Icons link exists
REGEX_LINK = re.compile(r'<link href="https://fonts.googleapis.com/icon\?family=Material\+Icons" rel="stylesheet">')

MATERIAL_LINK_TAG = '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    modified = False

    # 1. Ensure Material Icons Link exists in <head>
    if not REGEX_LINK.search(content):
        # Insert before closing </head> or end of font links
        if '</head>' in content:
            content = content.replace('</head>', f'    {MATERIAL_LINK_TAG}\n</head>')
            modified = True
        elif 'rel="stylesheet">' in content:
            # Try to append after the last link
            last_link = content.rfind('rel="stylesheet">') + len('rel="stylesheet">')
            content = content[:last_link] + f'\n    {MATERIAL_LINK_TAG}' + content[last_link:]
            modified = True

    # 2. Replace Iconify Span with Hybrid Logic
    # New Logic: ${(VAR).includes(':') ? '<span class="iconify" data-icon="' + (VAR) + '"></span>' : '<i class="material-icons">' + (VAR) + '</i>'}
    
    def replacement(match):
        var_expr = match.group(1) # e.g. d.ICON || 'check'
        # We need to construct the replacement string.
        # Since we are inside a template literal (backticks), we can use ${}
        # But we want to return a string from the ${} expression.
        
        # Logic:
        # ${ (VAR).includes(':') ? '<span class="iconify" data-icon="' + (VAR) + '"></span>' : '<i class="material-icons">' + (VAR) + '</i>' }
        
        return f"${{({var_expr}).includes(':') ? '<span class=\"iconify\" data-icon=\"' + ({var_expr}) + '\"></span>' : '<i class=\"material-icons\">' + ({var_expr}) + '</i>'}}"

    new_content = REGEX_ICONIFY_SPAN.sub(replacement, content)
    
    # 3. Replace Static Iconify Spans (material-symbols:foo-bar) -> <i class="material-icons">foo_bar</i>
    # Regex: <span class="iconify" data-icon="material-symbols:([\w-]+)"></span>
    REGEX_STATIC_ICON = re.compile(r'<span class="iconify" data-icon="material-symbols:([\w-]+)"></span>')
    
    def static_replacement(match):
        icon_name = match.group(1) # e.g. tips-and-updates
        # Convert hyphens to underscores for Google Fonts Material Icons
        # e.g. subdirectory-arrow-right -> subdirectory_arrow_right
        new_name = icon_name.replace('-', '_')
        return f'<i class="material-icons">{new_name}</i>'

    new_content = REGEX_STATIC_ICON.sub(static_replacement, new_content)
    
    if new_content != content:
        content = new_content
        modified = True

    if modified:
        print(f"Fixed: {os.path.basename(filepath)}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    else:
        print(f"Skipped (No match/Already present): {os.path.basename(filepath)}")

def main():
    print("Starting Hybrid Icon Optimization...")
    for filename in os.listdir(PACKS_DIR):
        if filename.endswith('.js') and filename.startswith('kr-clidn-'):
            filepath = os.path.join(PACKS_DIR, filename)
            process_file(filepath)
    print("Done.")

if __name__ == '__main__':
    main()
