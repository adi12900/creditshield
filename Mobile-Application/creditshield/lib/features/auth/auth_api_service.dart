import 'dart:convert';

import 'package:http/http.dart' as http;

const String _defaultApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:8000',
);

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
      borrower: BorrowerProfileDto.fromJson(json['borrower'] as Map<String, dynamic>),
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

  const BorrowerTrackerDto({
    required this.applicationId,
    required this.stage,
  });

  factory BorrowerTrackerDto.fromJson(Map<String, dynamic> json) {
    return BorrowerTrackerDto(
      applicationId: json['application_id'] as String?,
      stage: (json['stage'] as String?) ?? 'No active application',
    );
  }
}

class AuthApiService {
  final String baseUrl;
  final http.Client _client;

  AuthApiService({
    this.baseUrl = _defaultApiBaseUrl,
    http.Client? client,
  }) : _client = client ?? http.Client();

  Uri _uri(String path) => Uri.parse('${baseUrl.replaceAll(RegExp(r"/$"), '')}$path');

  Future<BorrowerAuthResult> signup({
    required String fullName,
    required String email,
    required String mobileNumber,
    required String password,
  }) async {
    final response = await _client.post(
      _uri('/api/v1/borrower/auth/signup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'full_name': fullName,
        'email': email,
        'mobile_number': mobileNumber,
        'password': password,
      }),
    );
    return _parseAuthResponse(response);
  }

  Future<BorrowerAuthResult> login({
    required String identifier,
    required String password,
  }) async {
    final response = await _client.post(
      _uri('/api/v1/borrower/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identifier': identifier,
        'password': password,
      }),
    );
    return _parseAuthResponse(response);
  }

  Future<BorrowerProfileDto> me(String accessToken) async {
    final response = await _client.get(
      _uri('/api/v1/borrower/auth/me'),
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return BorrowerProfileDto.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }
    throw Exception(_extractError(response));
  }

  Future<BorrowerKycStatusDto> getKycStatus(String accessToken) async {
    final response = await _client.get(
      _uri('/api/v1/borrower/kyc/status'),
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return BorrowerKycStatusDto.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }
    throw Exception(_extractError(response));
  }

  Future<void> completeKyc(String accessToken) async {
    final response = await _client.post(
      _uri('/api/v1/borrower/kyc/complete'),
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractError(response));
    }
  }

  Future<List<BorrowerOfferDto>> getOffers(String accessToken) async {
    final response = await _client.get(
      _uri('/api/v1/borrower/offers'),
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final body = jsonDecode(response.body) as List<dynamic>;
      return body
          .map((item) => BorrowerOfferDto.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    throw Exception(_extractError(response));
  }

  Future<BorrowerTrackerDto> getTracker(String accessToken) async {
    final response = await _client.get(
      _uri('/api/v1/borrower/tracker'),
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
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
      return BorrowerAuthResult.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
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
