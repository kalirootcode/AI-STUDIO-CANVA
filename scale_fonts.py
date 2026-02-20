import os
import re

PACKS_DIR = "/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack"
SCALE_FACTOR = 1.7

def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Regex to find font-size: 20px, font-size:24px, etc.
    # Group 1 is the prefix: "font-size:" possibly with spaces
    # Group 2 is the number
    # Group 3 is "px"
    def replacer(match):
        prefix = match.group(1)
        number_str = match.group(2)
        number = float(number_str)
        new_size = int(round(number * SCALE_FACTOR))
        return f"{prefix}{new_size}px"

    # Pattern looks for font-size:\s*(\d+(?:\.\d+)?)\s*px
    pattern = re.compile(r'(font-size:\s*)(\d+(?:\.\d+)?)\s*px', re.IGNORECASE)
    
    new_content, count = pattern.subn(replacer, content)

    # Let's also look for size properties inside svg, width/height if needed, but the plan was only font-size.
    # Are there any other hardcoded sizes we want to scale? Probably font-size is enough since it affects readability.
    
    if count > 0:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {file_path} - Modified {count} font-sizes")

def main():
    files_processed = 0
    total_modified = 0
    for filename in os.listdir(PACKS_DIR):
        if filename.startswith("kr-clidn-") and filename.endswith(".js"):
            file_path = os.path.join(PACKS_DIR, filename)
            process_file(file_path)
            files_processed += 1

    print(f"Processed {files_processed} template files.")

if __name__ == "__main__":
    main()
