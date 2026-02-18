import os
import re

directory = '/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack'
count = 0

# Regex to find the watermark span
# Matches: <span ...>CYBER-CANVAS // ...</span>
# We accept any attributes in the span tag
pattern = re.compile(r'<span[^>]*>CYBER-CANVAS // [^<]*</span>', re.IGNORECASE)

# Regex for "POWERED BY CYBER-CANVAS"
pattern2 = re.compile(r'POWERED BY CYBER-CANVAS', re.IGNORECASE)

for filename in os.listdir(directory):
    if filename.endswith(".js"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        new_content = content
        
        # Check and replace
        if pattern.search(new_content):
            new_content = pattern.sub('', new_content)
            
        if pattern2.search(new_content):
            new_content = pattern2.sub('', new_content)
            
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Removed watermark from {filename}")
            count += 1

print(f"Total files updated: {count}")
