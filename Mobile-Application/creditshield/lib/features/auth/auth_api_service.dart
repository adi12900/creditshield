import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

const String _configuredApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: '',
);

String get _defaultApiBaseUrl {
  final configured = _configuredApiBaseUrl.trim();
  if (configured.isNotEmpty) {
    return configured;
  }

  if (kIsWeb) {
    return 'http://127.0.0.1:8000';
  }

  switch (defaultTargetPlatform) {
    case TargetPlatform.android:
      return 'http://10.0.2.2:8000';
    case TargetPlatform.iOS:
    case TargetPlatform.linux:
    case TargetPlatform.macOS:
    case TargetPlatform.windows:
    case TargetPlatform.fuchsia:
      return 'http://127.0.0.1:8000';
  }
}

class BorrowerProfileDto {
  final int id;
  final String fullName;
  final String email;
  final String mobileNumber;

  const BorrowerProfileDto({
    required this.id,
    required this.fullName,
    required this.email,
    required this.mobileNumber,
  });

  factory BorrowerProfileDto.fromJson(Map<String, dynamic> json) {
    return BorrowerProfileDto(
      id: json['id'] as int,
      fullName: (json['full_name'] as String?) ?? '',
      email: (json['email'] as String?) ?? '',
      mobileNumber: (json['mobile_number'] as String?) ?? '',
    );
  }
}

class BorrowerKycStatusDto {
  final bool kycCompleted;

  const BorrowerKycStatusDto({required this.kycCompleted});

  factory BorrowerKycStatusDto.fromJson(Map<String, dynamic> json) {
    return BorrowerKycStatusDto(
      kycCompleted: (json['kyc_completed'] as bool?) ?? false,
    );
  }
}

class BorrowerAuthResult {
  final String accessToken;
  final String fullName;
  final BorrowerProfileDto borrower;

  const BorrowerAuthResult({
    required this.accessToken,
    required this.fullName,
    required this.borrower,
  });

  factory BorrowerAuthResult.fromJson(Map<String, dynamic> json) {
    return BorrowerAuthResult(
      accessToken: json['access_token'] as String,
      fullName: (json['full_name'] as String?) ?? '',
      borrower: BorrowerProfileDto.fromJson(
        json['borrower'] as Map<String, dynamic>,
      ),
    );
  }
}

class BorrowerOfferDto {
  final String offerId;
  final String lender;
  final double amount;
  final double apr;
  final int tenure;

  const BorrowerOfferDto({
    required this.offerId,
    required this.lender,
    required this.amount,
    required this.apr,
    required this.tenure,
  });

  factory BorrowerOfferDto.fromJson(Map<String, dynamic> json) {
    return BorrowerOfferDto(
      offerId: (json['offer_id'] as String?) ?? '',
      lender: (json['lender'] as String?) ?? 'Lender',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      apr: (json['apr'] as num?)?.toDouble() ?? 0,
      tenure: (json['tenure'] as int?) ?? 0,
    );
  }
}

class BorrowerTrackerDto {
  final String? applicationId;
  final String stage;

  const BorrowerTrackerDto({required this.applicationId, required this.stage});

  factory BorrowerTrackerDto.fromJson(Map<String, dynamic> json) {
    return BorrowerTrackerDto(
      applicationId: json['application_id'] as String?,
      stage: (json['stage'] as String?) ?? 'No active application',
    );
  }
}

class AuthApiService {
  static const Duration _requestTimeout = Duration(seconds: 20);

  final String baseUrl;
  final http.Client _client;

  AuthApiService({String? baseUrl, http.Client? client})
    : baseUrl = (baseUrl == null || baseUrl.trim().isEmpty)
          ? _defaultApiBaseUrl
          : baseUrl,
      _client = client ?? http.Client();

  Uri _uri(String path) =>
      Uri.parse('${baseUrl.replaceAll(RegExp(r"/$"), '')}$path');

  Future<http.Response> _request(
    Future<http.Response> Function() action,
    Uri uri,
  ) async {
    try {
      return await action().timeout(
        _requestTimeout,
        onTimeout: () {
          throw TimeoutException(
            'Request timed out after ${_requestTimeout.inSeconds} seconds',
          );
        },
      );
    } catch (error) {
      _throwNetworkError(uri, error);
    }
  }

  Never _throwNetworkError(Uri uri, Object error) {
    if (error is TimeoutException) {
      throw Exception(
        'Backend request to $uri timed out. Check that the API server is running and reachable from the device or simulator.',
      );
    }

    if (error is http.ClientException) {
      throw Exception(
        'Could not reach backend at $baseUrl. Check the API host, network, and server status.',
      );
    }

    throw Exception(error.toString());
  }

  Future<BorrowerAuthResult> signup({
    required String fullName,
    required String email,
    required String mobileNumber,
    required String password,
  }) async {
    final requestUri = _uri('/api/v1/borrower/auth/signup');
    final response = await _request(
      () => _client.post(
        requestUri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'full_name': fullName,
          'email': email,
          'mobile_number': mobileNumber,
          'password': password,
        }),
      ),
      requestUri,
    );
    return _parseAuthResponse(response);
  }

  Future<BorrowerAuthResult> login({
    required String identifier,
    required String password,
  }) async {
    final requestUri = _uri('/api/v1/borrower/auth/login');
    final response = await _request(
      () => _client.post(
        requestUri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'identifier': identifier, 'password': password}),
      ),
      requestUri,
    );
    return _parseAuthResponse(response);
  }

  Future<BorrowerProfileDto> me(String accessToken) async {
    final requestUri = _uri('/api/v1/borrower/auth/me');
    final response = await _request(
      () => _client.get(
        requestUri,
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
      requestUri,
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return BorrowerProfileDto.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>,
      );
    }
    throw Exception(_extractError(response));
  }

  Future<BorrowerKycStatusDto> getKycStatus(String accessToken) async {
    final requestUri = _uri('/api/v1/borrower/kyc/status');
    final response = await _request(
      () => _client.get(
        requestUri,
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
      requestUri,
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return BorrowerKycStatusDto.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>,
      );
    }
    throw Exception(_extractError(response));
  }

  Future<void> completeKyc(String accessToken) async {
    final requestUri = _uri('/api/v1/borrower/kyc/complete');
    final response = await _request(
      () => _client.post(
        requestUri,
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
      requestUri,
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractError(response));
    }
  }

  Future<List<BorrowerOfferDto>> getOffers(String accessToken) async {
    final requestUri = _uri('/api/v1/borrower/offers');
    final response = await _request(
      () => _client.get(
        requestUri,
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
      requestUri,
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final body = jsonDecode(response.body) as List<dynamic>;
      return body
          .map(
            (item) => BorrowerOfferDto.fromJson(item as Map<String, dynamic>),
          )
          .toList();
    }
    throw Exception(_extractError(response));
  }

  Future<BorrowerTrackerDto> getTracker(String accessToken) async {
    final requestUri = _uri('/api/v1/borrower/tracker');
    final response = await _request(
      () => _client.get(
        requestUri,
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
      requestUri,
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return BorrowerTrackerDto.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>,
      );
    }
    throw Exception(_extractError(response));
  }

  BorrowerAuthResult _parseAuthResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return BorrowerAuthResult.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>,
      );
    }
    throw Exception(_extractError(response));
  }

  String _extractError(http.Response response) {
    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final detail = body['detail'];
      if (detail is String && detail.trim().isNotEmpty) {
        return detail;
      }
      if (detail is List && detail.isNotEmpty) {
        return detail.first.toString();
      }
    } catch (_) {
      // Use fallback below.
    }
    return 'Request failed (${response.statusCode})';
  }
}
