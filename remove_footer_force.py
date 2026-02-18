import os
import re

directory = '/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack'
count = 0

# Regex to find the footer block based on opacity and bar
# Matches div with opacity:0.5 that contains the bar div
pattern = re.compile(r'<div style="[^"]*opacity:0\.5;[^"]*">\s*<div style="width:40px; height:4px;[\s\S]*?</div>\s*</div>', re.IGNORECASE)

# Regex for the "space-between" variant just in case (though 25 is fixed)
# which might also contain the bar
pattern2 = re.compile(r'<div style="[^"]*justify-content:space-between;[^"]*opacity:0\.5;[^"]*">[\s\S]*?</div>', re.IGNORECASE)

for filename in os.listdir(directory):
    if filename.endswith(".js"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        new_content = content
        
        if pattern.search(new_content):
            new_content = pattern.sub('', new_content)
            # print(f"Pattern 1 match in {filename}")
            
        if pattern2.search(new_content):
            new_content = pattern2.sub('', new_content)
            # print(f"Pattern 2 match in {filename}")
            
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Removed footer from {filename}")
            count += 1

print(f"Total files updated: {count}")
