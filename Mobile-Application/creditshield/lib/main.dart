import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:creditshield/app/app_state.dart';
import 'package:creditshield/app/router/app_router.dart';
import 'package:creditshield/core/design_system/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final appState = AppState();
  runApp(
    ChangeNotifierProvider.value(
      value: appState,
      child: const CreditShieldApp(),
    ),
  );
}

class CreditShieldApp extends StatefulWidget {
  const CreditShieldApp({super.key});

  @override
  State<CreditShieldApp> createState() => _CreditShieldAppState();
}

class _CreditShieldAppState extends State<CreditShieldApp> {
  late final _router = createRouter(context.read<AppState>());

  @override
  Widget build(BuildContext context) {
    // watch triggers rebuild on language/theme change
    context.watch<AppState>();
    return MaterialApp.router(
      title: 'CreditShield',
      debugShowCheckedModeBanner: false,
      theme: lightTheme(),
      darkTheme: darkTheme(),
      themeMode: ThemeMode.system,
      // Cap font scaling at 1.3× per Req 18.24
      builder: (context, child) {
        final mq = MediaQuery.of(context);
        return MediaQuery(
          data: mq.copyWith(
            textScaler: TextScaler.linear(mq.textScaler.scale(1).clamp(0.8, 1.3)),
          ),
          child: child!,
        );
      },
      routerConfig: _router,
    );
  }
}
