
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class DashboardScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Dashboard"),
        actions: [
          IconButton(icon: Icon(Icons.logout), onPressed: () => context.go('/')),
        ],
      ),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          _buildHeroCard(context),
          SizedBox(height: 24),
          Text("Recent Activity", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          SizedBox(height: 12),
          _buildActivityItem("Completed 'React Basics' Quiz", "10 mins ago", Colors.green),
          _buildActivityItem("Viewed 'Advanced SQL' Flashcards", "2 hours ago", Colors.blue),
          _buildActivityItem("Started 'Python Mastery' Course", "Yesterday", Colors.orange),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/chat'),
        icon: Icon(Icons.chat_bubble_outline),
        label: Text("AI Tutor"),
        backgroundColor: Theme.of(context).primaryColor,
      ),
    );
  }

  Widget _buildHeroCard(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [Colors.purple.shade900, Colors.blue.shade900]),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Keep Learning, User!", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          Text("You have a 5-day streak. Complete a quiz to keep it up!", style: TextStyle(color: Colors.white70)),
          SizedBox(height: 20),
          LinearProgressIndicator(value: 0.7, backgroundColor: Colors.white24, color: Colors.white),
          SizedBox(height: 8),
          Text("Weekly Goal: 70%", style: TextStyle(color: Colors.white54, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildActivityItem(String title, String time, Color color) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(backgroundColor: color.withOpacity(0.2), child: Icon(Icons.check, color: color, size: 16)),
        title: Text(title, style: TextStyle(fontWeight: FontWeight.w500)),
        subtitle: Text(time, style: TextStyle(fontSize: 12, color: Colors.white38)),
        trailing: Icon(Icons.arrow_forward_ios, size: 14, color: Colors.white24),
      ),
    );
  }
}
