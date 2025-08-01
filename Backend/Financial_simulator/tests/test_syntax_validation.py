"""
Test suite to validate Python syntax across all modules.
This test will catch the indentation error we fixed.
"""

import ast
import os
import sys
import pytest
from pathlib import Path

# Add the Financial_simulator directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent / "Financial_simulator"))

class TestSyntaxValidation:
    """Test class to validate Python syntax in all modules."""
    
    def test_langgraph_implementation_syntax(self):
        """Test that langgraph_implementation.py has valid Python syntax."""
        file_path = Path(__file__).parent.parent / "Financial_simulator" / "langgraph_implementation.py"
        
        with open(file_path, 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        try:
            # This will raise SyntaxError if there are syntax issues
            ast.parse(source_code)
            print("✅ langgraph_implementation.py syntax is valid")
        except SyntaxError as e:
            pytest.fail(f"Syntax error in langgraph_implementation.py at line {e.lineno}: {e.msg}")
        except IndentationError as e:
            pytest.fail(f"Indentation error in langgraph_implementation.py at line {e.lineno}: {e.msg}")
    
    def test_langgraph_api_syntax(self):
        """Test that langgraph_api.py has valid Python syntax."""
        file_path = Path(__file__).parent.parent / "Financial_simulator" / "langgraph_api.py"
        
        with open(file_path, 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        try:
            ast.parse(source_code)
            print("✅ langgraph_api.py syntax is valid")
        except (SyntaxError, IndentationError) as e:
            pytest.fail(f"Syntax error in langgraph_api.py at line {e.lineno}: {e.msg}")
    
    def test_teacher_agent_syntax(self):
        """Test that teacher_agent.py has valid Python syntax."""
        file_path = Path(__file__).parent.parent / "Financial_simulator" / "teacher_agent.py"
        
        with open(file_path, 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        try:
            ast.parse(source_code)
            print("✅ teacher_agent.py syntax is valid")
        except (SyntaxError, IndentationError) as e:
            pytest.fail(f"Syntax error in teacher_agent.py at line {e.lineno}: {e.msg}")
    
    def test_all_python_files_syntax(self):
        """Test syntax for all Python files in the Financial_simulator directory."""
        base_dir = Path(__file__).parent.parent / "Financial_simulator"
        python_files = list(base_dir.glob("*.py"))
        
        syntax_errors = []
        
        for py_file in python_files:
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    source_code = f.read()
                ast.parse(source_code)
                print(f"✅ {py_file.name} syntax is valid")
            except (SyntaxError, IndentationError) as e:
                error_msg = f"{py_file.name} at line {e.lineno}: {e.msg}"
                syntax_errors.append(error_msg)
                print(f"❌ Syntax error in {error_msg}")
        
        if syntax_errors:
            pytest.fail(f"Syntax errors found in {len(syntax_errors)} files:\n" + "\n".join(syntax_errors))
    
    def test_indentation_consistency(self):
        """Test that indentation is consistent (spaces vs tabs)."""
        file_path = Path(__file__).parent.parent / "Financial_simulator" / "langgraph_implementation.py"
        
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        mixed_indentation_lines = []
        
        for i, line in enumerate(lines, 1):
            if line.strip():  # Skip empty lines
                leading_whitespace = line[:len(line) - len(line.lstrip())]
                if '\t' in leading_whitespace and ' ' in leading_whitespace:
                    mixed_indentation_lines.append(i)
        
        if mixed_indentation_lines:
            pytest.fail(f"Mixed tabs and spaces found at lines: {mixed_indentation_lines}")
        
        print("✅ Indentation consistency check passed")

    def test_specific_function_syntax(self):
        """Test the specific function that had the indentation error."""
        file_path = Path(__file__).parent.parent / "Financial_simulator" / "langgraph_implementation.py"
        
        with open(file_path, 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        # Check if the problematic line exists and is properly indented
        lines = source_code.split('\n')
        goal_tracker_lines = []
        in_goal_tracker = False
        
        for i, line in enumerate(lines):
            if 'def goal_tracker_node(' in line:
                in_goal_tracker = True
                goal_tracker_lines.append((i+1, line))
            elif in_goal_tracker:
                if line.strip() and not line.startswith(' ') and not line.startswith('\t'):
                    # End of function
                    break
                goal_tracker_lines.append((i+1, line))
        
        # Look for the specific line that was causing issues
        output_path_lines = [
            (line_num, line) for line_num, line in goal_tracker_lines 
            if 'output_path = f"output/{user_id}_goal_status_simulation.json"' in line
        ]
        
        assert len(output_path_lines) == 1, f"Expected 1 output_path line, found {len(output_path_lines)}"
        
        line_num, line = output_path_lines[0]
        # Check that the line is properly indented (should have 8 spaces for this context)
        leading_spaces = len(line) - len(line.lstrip())
        assert leading_spaces == 8, f"Line {line_num} should have 8 spaces, has {leading_spaces}"
        
        print(f"✅ Specific problematic line at {line_num} is properly indented")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
