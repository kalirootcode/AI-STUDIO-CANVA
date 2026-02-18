
import os
import re

PACKS_DIR = "/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack"

def standardize_brand():
    files = [f for f in os.listdir(PACKS_DIR) if f.startswith('kr-clidn-') and f.endswith('.js')]
    
    count = 0
    for filename in files:
        filepath = os.path.join(PACKS_DIR, filename)
        with open(filepath, 'r') as f:
            content = f.read()
            
        original_content = content
        
        # 1. Replace DOMINION with KR-CLIDN in the brand header div
        # Using regex to be safe about whitespace
        content = re.sub(r'<div class="brand-text">\s*DOMINION\s*</div>', '<div class="brand-text">KR-CLIDN</div>', content)
        
        # 2. Also check if there are any other stray "DOMINION" texts in brand-text class that might have different spacing
        # This is a fallback
        if 'DOMINION' in content:
             content = content.replace('>DOMINION<', '>KR-CLIDN<')

        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Updated {filename}")
            count += 1
        else:
            print(f"No changes needed for {filename}")

    print(f"Total files updated: {count}")

if __name__ == "__main__":
    standardize_brand()
