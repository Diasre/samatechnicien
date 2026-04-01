
import sys

def check_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    pairs = {'{': '}', '[': ']', '(': ')'}
    inverse = {v: k for k, v in pairs.items()}
    
    for i, char in enumerate(content):
        if char in pairs:
            stack.append((char, i))
        elif char in inverse:
            if not stack:
                print(f"Extra '{char}' at index {i}")
                # Print context
                start = max(0, i-20)
                end = min(len(content), i+20)
                print(f"Context: {content[start:end]}")
                return False
            top, pos = stack.pop()
            if top != inverse[char]:
                print(f"Mismatched '{char}' at index {i}, matches '{top}' at index {pos}")
                return False
    
    if stack:
        for char, pos in stack:
            print(f"Unclosed '{char}' at index {pos}")
            start = max(0, pos-20)
            end = min(len(content), pos+20)
            print(f"Context: {content[start:end]}")
        return False
    
    print("All balanced!")
    return True

if __name__ == "__main__":
    check_file(sys.argv[1])
