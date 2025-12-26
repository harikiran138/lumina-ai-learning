
import 'package:flutter/material.dart';
import 'screens/chat_screen.dart';

void main() {
  runApp(LuminaApp());
}

class LuminaApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lumina AI Tutor',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        primaryColor: Color(0xFF00ADB5),
        scaffoldBackgroundColor: Color(0xFF121212),
      ),
      home: ChatScreen(),
    );
  }
}
