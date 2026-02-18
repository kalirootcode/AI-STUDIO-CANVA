import os
import re

TARGET_DIR = "/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack"

# 1.4x Scaling
SCALE_FACTOR = 1.4

def scale_font_size(match):
    original_size = int(match.group(1))
    # Cap overly large sizes (e.g. 200px) from being absurd
    if original_size > 150: return f"font-size: {original_size}px"
    
    new_size = int(original_size * SCALE_FACTOR)
    return f"font-size: {new_size}px"

def inject_pro_card_styles(content, class_name):
    # Regex to find .class_name { ... }
    # We want to ADD properties to it, or REPLACE.
    # Replacing is safer for consistency.
    
    # We look for: .class_name\s*{([^}]*)}
    # And we append/overwrite.
    
    pattern = re.compile(rf"(\.{class_name}\s*\{{)([^}}]*)(\}})")
    
    def replacer(match):
        prefix = match.group(1)
        existing_rules = match.group(2)
        suffix = match.group(3)
        
        # Define Pro Card props
        pro_props = """
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-left: 4px solid #00D9FF;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.6);
            backdrop-filter: blur(12px);
            margin-bottom: 30px;
        """
        
        # If existing rules have font-size, keep them (they are scaled separately).
        return f"{prefix}{existing_rules}{pro_props}{suffix}"
        
    return pattern.sub(replacer, content)

def process_file(filepath, filename):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. SCALE FONTS
    # Avoid scaling things inside <meta> or comments if possible, but Regex is simple.
    # We focus on CSS part? Mostly.
    # Pattern: font-size: 12px;
    content = re.sub(r'font-size:\s*(\d+)px', scale_font_size, content)

    # 2. PRO CARDS
    # Apply to: definition, description, intro, context, explanation
    target_classes = ['definition', 'description', 'intro', 'context', 'explanation', 'term-body', 'cmd-desc']
    for cls in target_classes:
        if f".{cls}" in content:
            content = inject_pro_card_styles(content, cls)

    # 3. CENTERING (Specific to kr-clidn-15)
    if filename == "kr-clidn-15.js" or filename == "kr-clidn-03.js": # Feature and Definition
        if ".safe-zone" in content:
            # Force centering
            content = content.replace(
                "justify-content: space-between;", 
                "justify-content: center; gap: 40px; text-align: center;"
            )
            # Center points container?
            # .points { ... } -> align-items: center?
            # But point-item text should differ.
            # Let's auto-center the container but keep items nice.
            content = content.replace(".points {", ".points { align-items: center;")
            
            # Remove border-left from definition locally for centered look?
            # Pro Card adds border-left.
            # If centered, maybe border-top or no border?
            # User likes "card professional". Border-left is part of that.
            # I'll keep border-left but maybe increase padding-left if needed.

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filename}")

def main():
    files = sorted(os.listdir(TARGET_DIR))
    for filename in files:
        if filename.startswith("kr-clidn-") and filename.endswith(".js"):
            full_path = os.path.join(TARGET_DIR, filename)
            process_file(full_path, filename)

if __name__ == "__main__":
    main()
