import os
import re

TARGET_DIR = "/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_len = len(content)

    # 1. Remove HTML
    # Pattern: <div class="bracket bracket-tl">┌─</div>
    # Using specific class matching to be safe
    content = re.sub(r'<div class="bracket[^"]*">.*?</div>', '', content, flags=re.DOTALL)

    # 2. Remove CSS
    # Pattern: .bracket { ... }
    content = re.sub(r'\.bracket\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    # Pattern: .bracket-tl { ... }
    content = re.sub(r'\.bracket-[a-z]+\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    
    # 3. Cleanup empty lines left behind?
    # content = re.sub(r'\n\s*\n', '\n', content) # Optional, strictly cosmetic

    if len(content) != original_len:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Cleaned {filepath}")
    else:
        print(f"No changes in {filepath}")

def main():
    files = sorted(os.listdir(TARGET_DIR))
    for filename in files:
        if filename.startswith("kr-clidn-") and filename.endswith(".js"):
            full_path = os.path.join(TARGET_DIR, filename)
            process_file(full_path)

if __name__ == "__main__":
    main()
