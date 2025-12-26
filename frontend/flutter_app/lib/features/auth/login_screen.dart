
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController(text: 'student@lumina.ai');
  final _passCtrl = TextEditingController(text: 'password');
  bool _isLoading = false;

  void _login() async {
    setState(() => _isLoading = true);
    
    // Simulate Login or Call Real API
    try {
        // Uncomment to use real backend
        // final res = await ApiClient().post('/auth/login', {
        //   'username': _emailCtrl.text,
        //   'password': _passCtrl.text
        // });
        // ApiClient().setToken(res['access_token']);
        
        // Mock Success
        await Future.delayed(Duration(seconds: 1));
        
        if (mounted) context.go('/dashboard');
    } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Login Failed: $e")));
    } finally {
        if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(Icons.auto_awesome, size: 64, color: Theme.of(context).primaryColor),
              SizedBox(height: 24),
              Text(
                "Welcome to Lumina", 
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center
              ),
              SizedBox(height: 8),
              Text(
                "AI-Powered Personalized Learning", 
                style: TextStyle(color: Colors.white54),
                textAlign: TextAlign.center
              ),
              SizedBox(height: 48),
              TextField(
                controller: _emailCtrl,
                decoration: InputDecoration(prefixIcon: Icon(Icons.email_outlined), hintText: "Email"),
              ),
              SizedBox(height: 16),
              TextField(
                controller: _passCtrl,
                obscureText: true,
                decoration: InputDecoration(prefixIcon: Icon(Icons.lock_outline), hintText: "Password"),
              ),
              SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _login,
                child: _isLoading ? CircularProgressIndicator(color: Colors.black) : Text("Sign In"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
