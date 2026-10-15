// Bootstrap mínimo: solo arranca la app (ver app/app.dart).
// Dejarlo fino permite integration_test y probes sin cargar UI.
import 'package:flutter/material.dart';

import 'package:me_proyecto/app/app.dart';

void main() {
  runApp(const MyNovelApp());
}
