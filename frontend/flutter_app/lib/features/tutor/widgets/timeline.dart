
import 'package:flutter/material.dart';

class TimelineWidget extends StatelessWidget {
  final List<Map<String, dynamic>> events;

  const TimelineWidget({Key? key, required this.events}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return SizedBox();

    return Column(
      children: events.asMap().entries.map((entry) {
        int idx = entry.key;
        var event = entry.value;
        bool isLast = idx == events.length - 1;

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Line Column
              SizedBox(
                width: 40,
                child: Column(
                  children: [
                    Container(
                      width: 12, height: 12,
                      decoration: BoxDecoration(
                        color: Color(0xFF00ADB5),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                    if (!isLast) Expanded(child: Container(width: 2, color: Colors.white24))
                  ],
                ),
              ),
              // Content
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          event['date'] ?? '',
                          style: TextStyle(color: Color(0xFF00ADB5), fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        SizedBox(height: 4),
                        Text(
                          event['title'] ?? 'Event',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        SizedBox(height: 8),
                         Text(
                          event['description'] ?? '',
                          style: TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            ],
          ),
        );
      }).toList(),
    );
  }
}
