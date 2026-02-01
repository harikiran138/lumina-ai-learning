
import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import '../../features/tutor/widgets/renderer.dart';
import 'package:uuid/uuid.dart'; // Add uuid to pubspec if needed, or simple rand string

class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final String _sessionId = "mob_session_${DateTime.now().millisecondsSinceEpoch}"; // Simple ID

  final List<Map<String, dynamic>> _messages = [
    {
      'role': 'ai',
      'content': "Hi! I'm Lumina. I'm connected to your Python Brain. Ask me anything!"
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
    _scrollToBottom();

    try {
      // REAL Backend Call
      final response = await ApiClient().post('/tutor/chat', {
        'message': text,
        'user_id': 'mob_user_1',
        'session_id': _sessionId,
        'provider': 'ollama' // or gemini
      });

      String aiText = response['response'] ?? "I didn't get a response.";

      if (mounted) {
        setState(() {
          _messages.add({'role': 'ai', 'content': aiText});
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add({'role': 'ai', 'content': "⚠️ Error: $e"});
        });
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleAction(String action, Map<String, dynamic> data) {
    if (action == 'quiz_next') {
       _sendMessage("Next question please");
    } else if (action == 'quiz_answer') {
       // Log answer silently or show feedback? The Quiz component shows feedback locally.
       // We could send a log to backend here:
       // ApiClient().post('/assessment/log', ...);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Theme Colors
    final primary = Theme.of(context).primaryColor;

    return Scaffold(
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
              controller: _scrollController,
              padding: EdgeInsets.all(16),
              itemCount: _messages.length + (_isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length) {
                   return Center(child: Padding(
                     padding: const EdgeInsets.all(8.0),
                     child: CircularProgressIndicator(color: primary),
                   ));
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
                      color: primary,
                      borderRadius: BorderRadius.circular(16).copyWith(bottomRight: Radius.circular(0)),
                    ) : null,
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
              color: Theme.of(context).cardColor,
              border: Border(top: BorderSide(color: Colors.white12)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    style: TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: "Type a message...",
                      hintStyle: TextStyle(color: Colors.white38),
                      border: InputBorder.none,
                      fillColor: Colors.transparent
                    ),
                    onSubmitted: _sendMessage,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.send_rounded, color: primary),
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
