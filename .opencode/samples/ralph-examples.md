# Ralph Wiggum Plugin Examples

## Quick Start

```bash
# Start a basic development loop
/ralph-loop "Build a simple calculator app with tests" 10

# Work on your task...

# Continue to next iteration when ready
/ralph-continue

# Cancel if needed
/cancel-ralph
```

## Example Workflows

### 1. Test-Driven Development
```bash
/ralph-loop "Implement user authentication using TDD:
1. Write failing tests for login/register
2. Implement the functionality
3. Make tests pass
4. Refactor if needed
Output <promise>ALL TESTS PASSING</promise> when complete" 20 "ALL TESTS PASSING"
```

### 2. Bug Fixing
```bash
/ralph-loop "Fix the memory leak in the data processing pipeline:
1. Identify the source of the leak
2. Implement a fix
3. Verify fix with tests
4. Ensure no regression
Output <promise>MEMORY LEAK FIXED</promise> when resolved" 15 "MEMORY LEAK FIXED"
```

### 3. Feature Implementation
```bash
/ralph-loop "Add real-time notifications feature:
1. Design the notification system
2. Implement backend WebSocket support
3. Create frontend notification UI
4. Add comprehensive tests
5. Update documentation
Output <promise>NOTIFICATIONS COMPLETE</promise> when fully working" 30 "NOTIFICATIONS COMPLETE"
```

## Best Practices

1. **Clear completion criteria**: Always specify what "done" looks like
2. **Use completion promises**: Set `<promise>TEXT</promise>` for automatic termination
3. **Set reasonable limits**: Use max-iterations to prevent runaway loops
4. **Break down complex tasks**: Large features work better as smaller, focused loops

## Monitoring Your Loop

```bash
# Check current loop status
cat .opencode/ralph-state.json

# View iteration progress
grep '"iteration"' .opencode/ralph-state.json
```

## Need Help?

- Check the full documentation: https://github.com/opencode-community/opencode-ralph-wiggum
- Report issues: https://github.com/opencode-community/opencode-ralph-wiggum/issues
