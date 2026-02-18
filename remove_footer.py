import os
import re

directory = '/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack'
count = 0

# Regex to find the footer block
# Matches <!-- Footer --> (optional) followed by the specific div
pattern = re.compile(r'(\s*<!-- Footer -->)?\s*<div style="margin-top:\s*auto;[^"]*">[\s\S]*?</div>', re.IGNORECASE)

for filename in os.listdir(directory):
    if filename.endswith(".js"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Check if file has the specific style
        if 'margin-top:auto; display:flex; align-items:center; opacity:0.5;' in content.replace(' ', ''): 
            # Normalized check might be hard, so let's just rely on regex
            pass
            
        new_content = content
        if pattern.search(new_content):
            new_content = pattern.sub('', new_content)
            
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Removed footer from {filename}")
            count += 1

print(f"Total files updated: {count}")
