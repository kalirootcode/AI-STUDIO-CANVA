import os
import re

PACKS_DIR = "/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack"
MIN_SIZE = 34

def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    def replacer(match):
        prefix = match.group(1)
        number_str = match.group(2)
        number = float(number_str)
        if number < MIN_SIZE:
            return f"{prefix}{MIN_SIZE}px"
        return match.group(0)

    # Note: We match font-size properties.
    pattern = re.compile(r'(font-size:\s*)(\d+(?:\.\d+)?)\s*px', re.IGNORECASE)
    
    new_content, count = pattern.subn(replacer, content)
    
    if new_content != content: # Meaning we changed something
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {file_path}")
        return True
    return False

def main():
    files_updated = 0
    # Include the base template and all kr-clidn-*.js files
    files_to_check = ['_tiktok_base_template.js']
    files_to_check.extend([f for f in os.listdir(PACKS_DIR) if f.startswith("kr-clidn-") and f.endswith(".js")])

    for filename in files_to_check:
        file_path = os.path.join(PACKS_DIR, filename)
        if os.path.isfile(file_path):
            if process_file(file_path):
                files_updated += 1
            
    print(f"Enforced minimum font size in {files_updated} template files.")

if __name__ == "__main__":
    main()
