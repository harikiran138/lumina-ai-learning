
import 'package:flutter/material.dart';
import '../models/a2ui_types.dart';
import 'quiz_card.dart';
import 'flashcard.dart';
import 'timeline.dart';

class A2UIRenderer extends StatelessWidget {
  final String content;
  final Function(String action, Map<String, dynamic> data)? onAction;

  const A2UIRenderer({Key? key, required this.content, this.onAction}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // 1. Extract non-code text
    final textParts = content.split(RegExp(r'```a2ui[\s\S]*?```'));
    final components = A2UIComponent.parse(content);

    List<Widget> widgets = [];

    // Simple interleaving (Assuming 1 component usually at end or middle)
    // For a robust implementation, we'd map ranges. For preview, we append components at the end.

    if (textParts.isNotEmpty && textParts[0].trim().isNotEmpty) {
      widgets.add(Padding(
        padding: const EdgeInsets.only(bottom: 12.0),
        child: Text(
          textParts[0].trim(),
          style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 16),
        ),
      ));
    }

    for (var comp in components) {
      widgets.add(Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: _buildComponent(comp),
      ));
    }

    if (textParts.length > 1 && textParts[1].trim().isNotEmpty) {
       widgets.add(Padding(
        padding: const EdgeInsets.only(top: 12.0),
        child: Text(
          textParts[1].trim(),
          style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 16),
        ),
      ));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  Widget _buildComponent(A2UIComponent comp) {
    switch (comp.type) {
      case 'Quiz':
        return QuizCard(
          question: comp.props['question'] ?? 'No Question',
          options: List<String>.from(comp.props['options'] ?? comp.props['answers'] ?? []),
          correctIndex: comp.props['correctIndex'] ?? 0,
          explanation: comp.props['explanation'],
          onAction: onAction,
        );
      case 'Flashcard':
        return FlashcardWidget(
          front: comp.props['front'] ?? '',
          back: comp.props['back'] ?? '',
        );
      case 'Timeline':
        return TimelineWidget(
           events: List<Map<String, dynamic>>.from(comp.props['events'] ?? []),
        );
      default:
        return Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.red.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.red.withOpacity(0.3)),
          ),
          child: Text('Unsupported Component: ${comp.type}', style: TextStyle(color: Colors.red)),
        );
    }
  }
}
