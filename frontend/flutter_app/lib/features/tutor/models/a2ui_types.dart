
import 'dart:convert';

class A2UIComponent {
  final String type;
  final Map<String, dynamic> props;

  A2UIComponent({required this.type, required this.props});

  factory A2UIComponent.fromJson(Map<String, dynamic> json) {
    return A2UIComponent(
      type: json['component'] ?? 'Unknown',
      props: json['props'] ?? {},
    );
  }

  static List<A2UIComponent> parse(String text) {
    final List<A2UIComponent> components = [];
    final regex = RegExp(r'```a2ui\n([\s\S]*?)\n```');

    final matches = regex.allMatches(text);
    for (final match in matches) {
      try {
        final jsonStr = match.group(1)!;
        final decoded = jsonDecode(jsonStr);
        if (decoded is List) {
          for (var item in decoded) {
            components.add(A2UIComponent.fromJson(item));
          }
        } else {
          components.add(A2UIComponent.fromJson(decoded));
        }
      } catch (e) {
        print('Error parsing A2UI: $e');
      }
    }
    return components;
  }
}
