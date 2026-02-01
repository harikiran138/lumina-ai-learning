
import 'package:flutter/material.dart';

class QuizCard extends StatefulWidget {
  final String question;
  final List<String> options;
  final int correctIndex;
  final String? explanation;
  final Function(String action, Map<String, dynamic> data)? onAction;

  const QuizCard({
    Key? key,
    required this.question,
    required this.options,
    required this.correctIndex,
    this.explanation,
    this.onAction,
  }) : super(key: key);

  @override
  _QuizCardState createState() => _QuizCardState();
}

class _QuizCardState extends State<QuizCard> {
  int? _selected;
  bool _isSubmitted = false;
  bool _isActionTaken = false; // For collapsed state

  void _handleSelect(int index) {
    if (!_isSubmitted) {
      setState(() {
        _selected = index;
      });
    }
  }

  void _submit() {
    if (_selected != null && !_isSubmitted) {
      setState(() {
        _isSubmitted = true;
      });
      if (widget.onAction != null) {
        widget.onAction!('quiz_answer', {
          'question': widget.question,
          'selected': widget.options[_selected!],
          'isCorrect': _selected == widget.correctIndex
        });
      }
    }
  }

  void _next() {
    setState(() {
      _isActionTaken = true;
    });
    if (widget.onAction != null) {
      widget.onAction!('quiz_next', {});
    }
  }

  @override
  Widget build(BuildContext context) {
    // Collapsed State Logic similar to Web
    if (_isActionTaken) {
      bool isCorrect = _selected == widget.correctIndex;
      return Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isCorrect ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isCorrect ? Colors.green.withOpacity(0.3) : Colors.red.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(isCorrect ? Icons.check_circle : Icons.cancel, color: isCorrect ? Colors.green : Colors.red),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.question, style: TextStyle(color: Colors.white70, fontSize: 14), maxLines: 1),
                  Text(
                    isCorrect ? "Correct" : "Incorrect",
                    style: TextStyle(color: isCorrect ? Colors.greenAccent : Colors.redAccent, fontSize: 12)
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // Active State
    Color primaryColor = Color(0xFF00ADB5); // Lumina Cyan

    return Card(
      color: Color(0xFF1E1E1E),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.white12)),
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.school, color: primaryColor, size: 18),
                SizedBox(width: 8),
                Text("Knowledge Check", style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold)),
              ],
            ),
            SizedBox(height: 12),
            Text(
              widget.question,
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
            ),
            SizedBox(height: 16),
            if (widget.options.isEmpty)
              Container(
                padding: EdgeInsets.all(12),
                color: Colors.yellow.withOpacity(0.1),
                child: Row(
                  children: [
                    Icon(Icons.warning, color: Colors.yellow),
                    SizedBox(width: 8),
                    Text("Error: No options provided", style: TextStyle(color: Colors.yellow)),
                  ],
                ),
              )
            else
              ...List.generate(widget.options.length, (index) {
                bool isSelected = _selected == index;
                bool isCorrectInfo = index == widget.correctIndex;

                Color borderColor = Colors.white10;
                Color bgColor = Colors.white.withOpacity(0.05);

                if (_isSubmitted) {
                  if (isCorrectInfo) {
                    borderColor = Colors.green;
                    bgColor = Colors.green.withOpacity(0.1);
                  } else if (isSelected) {
                    borderColor = Colors.red;
                    bgColor = Colors.red.withOpacity(0.1);
                  }
                } else if (isSelected) {
                   borderColor = primaryColor;
                   bgColor = primaryColor.withOpacity(0.1);
                }

                return GestureDetector(
                  onTap: () => _handleSelect(index),
                  child: AnimatedContainer(
                    duration: Duration(milliseconds: 200),
                    margin: EdgeInsets.only(bottom: 8),
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 24, height: 24,
                          decoration: BoxDecoration(
                            color: isSelected || (_isSubmitted && isCorrectInfo) ? borderColor : Colors.transparent,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.white24),
                          ),
                          child: Center(child: Text(String.fromCharCode(65 + index), style: TextStyle(fontSize: 12, color: Colors.white))),
                        ),
                        SizedBox(width: 12),
                        Expanded(child: Text(widget.options[index], style: TextStyle(color: Colors.white70))),
                        if (_isSubmitted && isCorrectInfo) Icon(Icons.check_circle, color: Colors.green, size: 20),
                        if (_isSubmitted && isSelected && !isCorrectInfo) Icon(Icons.cancel, color: Colors.red, size: 20),
                      ],
                    ),
                  ),
                );
              }),

              if (!_isSubmitted)
                Padding(
                  padding: const EdgeInsets.only(top: 16.0),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _selected == null ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        padding: EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text("Submit Answer", style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                )
              else
                Padding(
                   padding: const EdgeInsets.only(top: 16.0),
                   child: SizedBox(
                      width: double.infinity,
                       child: ElevatedButton.icon(
                        onPressed: _next,
                        icon: Icon(Icons.arrow_forward),
                        label: Text("Next Question"),
                         style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: Colors.black,
                           padding: EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                         ),
                       ),
                   ),
                )
          ],
        ),
      ),
    );
  }
}
