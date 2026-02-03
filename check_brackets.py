import sys

def check_brackets(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    brackets = {'{': '}', '[': ']', '(': ')'}
    for i, char in enumerate(content):
        if char in brackets:
            stack.append((char, i))
        elif char in brackets.values():
            if not stack:
                print(f"Extra closing bracket {char} at index {i}")
                return
            opening, pos = stack.pop()
            if brackets[opening] != char:
                print(f"Mismatched bracket {opening} at {pos} with {char} at {i}")
                return
    
    if stack:
        for opening, pos in stack:
            print(f"Unclosed bracket {opening} at index {pos}")
    else:
        print("Brackets are balanced.")

if __name__ == "__main__":
    check_brackets(sys.argv[1])
