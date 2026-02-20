import os
import re

PACKS_DIR = "/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack"

def main():
    files_to_check = [f for f in os.listdir(PACKS_DIR) if f.startswith("kr-clidn-") and f.endswith(".js")]
    
    missing_terminals = []

    for filename in files_to_check:
        file_path = os.path.join(PACKS_DIR, filename)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        has_command_var = re.search(r'esc\([^)]*(CMD|COMMAND)[^)]*\)', content)
        has_terminal = "terminal-window" in content
        
        if has_command_var and not has_terminal:
            missing_terminals.append(filename)
            
    print("Files with commands but NO terminal-window:")
    for f in missing_terminals:
        print(f)

if __name__ == "__main__":
    main()
