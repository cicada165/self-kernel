import os
import json
from datetime import datetime

class KernelMemory:
    def __init__(self, root_dir=None):
        self.root_dir = root_dir or os.getcwd()
        self.memory_file = os.path.join(self.root_dir, ".kernel.md")

    def read(self):
        """Reads the .kernel.md file."""
        if not os.path.exists(self.memory_file):
            return "# Kernel Memory\n\nNo memory initialized yet."
        with open(self.memory_file, 'r') as f:
            return f.read()

    def append_log(self, action, result):
        """Appends a new log entry to .kernel.md."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"\n\n### [{timestamp}] {action}\n- **Result**: {result}"
        
        mode = 'a' if os.path.exists(self.memory_file) else 'w'
        with open(self.memory_file, mode) as f:
            if mode == 'w':
                f.write("# Kernel Memory\n\nPersistent state and iteration history.")
            f.write(entry)
        print(f"✅ [MEMORY] Logged: {action}")

    def get_summary(self):
        """Returns a summarized version of the memory for prompt injection."""
        content = self.read()
        # Simple summary: last 5 entries
        lines = content.split('\n')
        if len(lines) > 20:
            return "\n".join(lines[:5] + ["..."] + lines[-15:])
        return content

if __name__ == "__main__":
    import sys
    km = KernelMemory()
    if len(sys.argv) > 2 and sys.argv[1] == "log":
        km.append_log(sys.argv[2], " ".join(sys.argv[3:]))
    else:
        print(km.read())
