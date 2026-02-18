import os

PACKS_DIR = "/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack"

def inject_brand_header():
    files = [f for f in os.listdir(PACKS_DIR) if f.endswith(".js") and f.startswith("kr-clidn-")]
    
    for filename in sorted(files):
        filepath = os.path.join(PACKS_DIR, filename)
        
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        if "renderBrandHeader" in content:
            print(f"Skipping {filename} (already has header)")
            continue

        if '<div class="safe-zone">' in content:
            # We insert the brand header immediately after the safe-zone opening tag
            replacement = '<div class="safe-zone">\n        ${TemplateUtils.renderBrandHeader()}'
            new_content = content.replace('<div class="safe-zone">', replacement)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {filename}")
        else:
            print(f"Warning: Could not find .safe-zone in {filename}")

if __name__ == "__main__":
    inject_brand_header()
