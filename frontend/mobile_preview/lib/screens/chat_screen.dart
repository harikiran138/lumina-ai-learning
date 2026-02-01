
import 'package:flutter/material.dart';
import '../widgets/a2ui/renderer.dart';
// import '../services/ai_service.dart'; // Placeholder

class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<Map<String, dynamic>> _messages = [
    {
      'role': 'ai',
      'content': "Hi! I'm Lumina. Ask me for a Quiz, Flashcards, or Timeline!"
    }
  ];
  bool _isLoading = false;

  void _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _isLoading = true;
    });
    _controller.clear();

    // Mock API Call - Replace with real http://10.0.2.2:8000 call
    // For now, simulating A2UI response logic
    await Future.delayed(Duration(seconds: 1));

    String responseContent = "I can help with that.";
    String lower = text.toLowerCase();

    if (lower.contains("quiz")) {
      responseContent = """Sure! Here is a quiz:
```a2ui
{ "component": "Quiz", "props": { "question": "What is Flutter?", "options": ["A Framework", "A Bird", "A Database", "A Game"], "correctIndex": 0 } }
```
""";
    } else if (lower.contains("flashcard")) {
       responseContent = """Here is your card:
```a2ui
{ "component": "Flashcard", "props": { "front": "StatefulWidget", "back": "A widget that has mutable state." } }
```
""";
    } else if (lower.contains("timeline")) {
      responseContent = """History of Flutter:
```a2ui
{ "component": "Timeline", "props": { "events": [{ "date": "2015", "title": "Began", "description": "Sky project started" }, { "date": "2018", "title": "Flutter 1.0", "description": "Stable release" }] } }
```
""";
    }

    setState(() {
      _messages.add({'role': 'ai', 'content': responseContent});
      _isLoading = false;
    });
  }

  void _handleAction(String action, Map<String, dynamic> data) {
    print("Action: $action, Data: $data");
    if (action == 'quiz_next') {
       _sendMessage("Next question please");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF121212),
      appBar: AppBar(
        title: Text("Lumina AI Tutor", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: _messages.length + (_isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length) {
                   return Center(child: CircularProgressIndicator(color: Color(0xFF00ADB5)));
                }

                final msg = _messages[index];
                bool isUser = msg['role'] == 'user';

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
                    margin: EdgeInsets.only(bottom: 16),
                    padding: isUser ? EdgeInsets.all(12) : EdgeInsets.zero,
                    decoration: isUser ? BoxDecoration(
                      color: Color(0xFF00ADB5),
                      borderRadius: BorderRadius.circular(16).copyWith(bottomRight: Radius.circular(0)),
                    ) : null, // AI messages handled by Renderer
                    child: isUser
                      ? Text(msg['content'], style: TextStyle(color: Colors.black, fontWeight: FontWeight.w500))
                      : A2UIRenderer(content: msg['content'], onAction: _handleAction),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Color(0xFF1E1E1E),
              border: Border(top: BorderSide(color: Colors.white12)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    style: TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: "Ask for a Quiz or Flashcard...",
                      hintStyle: TextStyle(color: Colors.white38),
                      border: InputBorder.none,
                    ),
                    onSubmitted: _sendMessage,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.send_rounded, color: Color(0xFF00ADB5)),
                  onPressed: () => _sendMessage(_controller.text),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
