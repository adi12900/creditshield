import 'package:flutter_test/flutter_test.dart';
import 'package:creditshield/main.dart';

void main() {
  testWidgets('CreditShield app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const CreditShieldApp());
    expect(find.byType(CreditShieldApp), findsOneWidget);
  });
}
